import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Button,
  ButtonVariant,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
  Title,
  ToolbarChip,
  ToolbarChipGroup,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  cellWidth,
  IActions,
  ICell,
  IRowData,
  sortable,
  TableText,
} from "@patternfly/react-table";
import { AddCircleOIcon } from "@patternfly/react-icons";

import { useDispatch } from "react-redux";
import { alertActions } from "store/alert";
import { confirmDialogActions } from "store/confirmDialog";

import {
  AppPlaceholder,
  ConditionalRender,
  AppTableWithControls,
} from "shared/components";
import {
  useTableControls,
  useFetchBusinessServices,
  useDeleteBusinessService,
} from "shared/hooks";

import { BusinessService, PageQuery, SortByQuery } from "api/models";
import { getAxiosErrorMessage } from "utils/utils";

import { NewBusinessServiceModal } from "./components/new-business-service-modal";
import { UpdateBusinessServiceModal } from "./components/update-business-service-modal";
import {
  FilterOption,
  SearchFilter,
} from "./components/search-filter/search-filter";

const columnIndexToField = (_: React.MouseEvent, index: number) => {
  switch (index) {
    case 0:
      return "name";
    case 2:
      return "owner";
    default:
      throw new Error("Invalid column index=" + index);
  }
};

const BUSINESS_SERVICE_FIELD = "businessService";

const getRow = (rowData: IRowData): BusinessService => {
  return rowData[BUSINESS_SERVICE_FIELD];
};

const itemsToRow = (items: BusinessService[]) => {
  return items.map((item) => ({
    [BUSINESS_SERVICE_FIELD]: item,
    cells: [
      {
        title: item.name,
      },
      {
        title: (
          <TableText wrapModifier="truncate">{item.description}</TableText>
        ),
      },
      {
        title: item.owner?.displayName,
      },
    ],
  }));
};

export const BusinessServices: React.FC = () => {
  const dispatch = useDispatch();

  const { t } = useTranslation();

  const [filterByName, setFilterByName] = useState<string[]>([]);
  const [filterByDescription, setFilterByDescription] = useState<string[]>([]);
  const [filterByOwner, setFilterByOwner] = useState<string[]>([]);

  const [
    isNewBusinessServiceModalOpen,
    setIsNewBusinessServiceModalOpen,
  ] = useState(false);
  const [
    businessServiceToUpdate,
    setbusinessServiceToUpdate,
  ] = useState<BusinessService>();

  const { deleteBusinessService } = useDeleteBusinessService();

  const {
    businessServices,
    isFetching,
    fetchError,
    fetchBusinessServices,
  } = useFetchBusinessServices(true);

  const {
    paginationQuery,
    sortByQuery,
    sortBy,
    handlePaginationChange,
    handleSortChange,
  } = useTableControls({ columnToField: columnIndexToField });

  const reloadTable = useCallback(
    (
      filters: { name?: string[]; description?: string[]; owner?: string[] },
      pagination: PageQuery,
      sortBy?: SortByQuery
    ) => {
      fetchBusinessServices(
        {
          name: filters.name,
          description: filters.description,
          owner: filters.owner,
        },
        pagination,
        sortBy
      );
    },
    [fetchBusinessServices]
  );

  useEffect(() => {
    reloadTable(
      {
        name: filterByName,
        description: filterByDescription,
        owner: filterByOwner,
      },
      paginationQuery,
      sortByQuery
    );
  }, [
    filterByName,
    filterByDescription,
    filterByOwner,
    paginationQuery,
    sortByQuery,
    reloadTable,
  ]);

  const columns: ICell[] = [
    { title: t("terms.name"), transforms: [sortable] },
    { title: t("terms.description"), transforms: [cellWidth(40)] },
    { title: t("terms.owner"), transforms: [sortable] },
  ];

  const actions: IActions = [
    {
      title: t("actions.edit"),
      onClick: (
        event: React.MouseEvent,
        rowIndex: number,
        rowData: IRowData
      ) => {
        const row: BusinessService = getRow(rowData);
        setbusinessServiceToUpdate(row);
      },
    },
    {
      title: t("actions.delete"),
      onClick: (
        event: React.MouseEvent,
        rowIndex: number,
        rowData: IRowData
      ) => {
        const row: BusinessService = getRow(rowData);

        dispatch(
          confirmDialogActions.openDialog({
            title: t("dialog.title.delete", { what: row.name }),
            message: t("dialog.message.delete", { what: row.name }),
            variant: ButtonVariant.danger,
            confirmBtnLabel: t("actions.delete"),
            cancelBtnLabel: t("actions.cancel"),
            onConfirm: () => {
              dispatch(confirmDialogActions.processing());
              deleteBusinessService(
                row,
                () => {
                  dispatch(confirmDialogActions.closeDialog());
                  reloadTable(
                    {
                      name: filterByName,
                      description: filterByDescription,
                      owner: filterByOwner,
                    },
                    paginationQuery,
                    sortByQuery
                  );
                },
                (error) => {
                  dispatch(confirmDialogActions.closeDialog());
                  dispatch(
                    alertActions.addAlert(
                      "danger",
                      "Error",
                      getAxiosErrorMessage(error)
                    )
                  );
                }
              );
            },
          })
        );
      },
    },
  ];

  //

  const filterOptions: FilterOption[] = [
    {
      key: "name",
      name: t("terms.name"),
    },
    {
      key: "description",
      name: t("terms.description"),
    },
    {
      key: "owner",
      name: t("terms.owner"),
    },
  ];

  const handleOnClearAllFilters = () => {
    setFilterByName([]);
    setFilterByDescription([]);
    setFilterByOwner([]);
  };

  const handleOnFilterApplied = (key: string, filterText: string) => {
    if (key === "name") {
      setFilterByName([...filterByName, filterText]);
    } else if (key === "description") {
      setFilterByDescription([...filterByDescription, filterText]);
    } else if (key === "owner") {
      setFilterByOwner([...filterByOwner, filterText]);
    } else {
      throw new Error("Filter not supported");
    }

    handlePaginationChange({ page: 1 });
  };

  const handleOnDeleteFilter = (
    category: string | ToolbarChipGroup,
    chip: ToolbarChip | string
  ) => {
    if (category === "name") {
      setFilterByName(filterByName.filter((f) => f !== chip));
    } else if (category === "description") {
      setFilterByDescription(filterByDescription.filter((f) => f !== chip));
    } else if (category === "owner") {
      setFilterByOwner(filterByOwner.filter((f) => f !== chip));
    } else {
      throw new Error("Filter not supported");
    }
  };

  const handleOnDeleteFilterGroup = (category: string | ToolbarChipGroup) => {
    if (typeof category === "string") {
      throw new Error("Category must be a ToolbarChipGroup and not a string");
    }

    if (category.key === "name") {
      setFilterByName([]);
    } else if (category.key === "description") {
      setFilterByDescription([]);
    } else if (category.key === "owner") {
      setFilterByOwner([]);
    } else {
      throw new Error("Filter not supported");
    }
  };

  //
  const handleOnOpenCreateNewBusinessServiceModal = () => {
    setIsNewBusinessServiceModalOpen(true);
  };

  //

  const handleOnCancelCreateBusinessService = () => {
    setIsNewBusinessServiceModalOpen(false);
  };

  const handleOnBusinessServiceCreated = () => {
    setIsNewBusinessServiceModalOpen(false);
    reloadTable(
      {
        name: filterByName,
        description: filterByDescription,
        owner: filterByOwner,
      },
      paginationQuery,
      sortByQuery
    );
  };

  //

  const handleOnBusinessServiceUpdated = () => {
    setbusinessServiceToUpdate(undefined);
    reloadTable(
      {
        name: filterByName,
        description: filterByDescription,
        owner: filterByOwner,
      },
      paginationQuery,
      sortByQuery
    );
  };

  const handleOnCancelUpdateBusinessService = () => {
    setbusinessServiceToUpdate(undefined);
  };

  return (
    <>
      <ConditionalRender
        when={isFetching && !(businessServices || fetchError)}
        then={<AppPlaceholder />}
      >
        <AppTableWithControls
          count={businessServices ? businessServices.meta.count : 0}
          items={businessServices ? businessServices.data : []}
          itemsToRow={itemsToRow}
          pagination={paginationQuery}
          sortBy={sortBy}
          handlePaginationChange={handlePaginationChange}
          handleSortChange={handleSortChange}
          columns={columns}
          actions={actions}
          isLoading={isFetching}
          loadingVariant="skeleton"
          fetchError={fetchError}
          clearAllFilters={handleOnClearAllFilters}
          filtersApplied={
            filterByName.length +
              filterByDescription.length +
              filterByOwner.length >
            0
          }
          toolbarToggle={
            <ToolbarGroup variant="filter-group">
              <ToolbarFilter
                chips={filterByName}
                deleteChip={handleOnDeleteFilter}
                deleteChipGroup={handleOnDeleteFilterGroup}
                categoryName={{ key: "name", name: t("terms.name") }}
                showToolbarItem
              >
                {null}
              </ToolbarFilter>
              <ToolbarFilter
                chips={filterByDescription}
                deleteChip={handleOnDeleteFilter}
                deleteChipGroup={handleOnDeleteFilterGroup}
                categoryName={{
                  key: "description",
                  name: t("terms.description"),
                }}
                showToolbarItem
              >
                {null}
              </ToolbarFilter>
              <ToolbarFilter
                chips={filterByOwner}
                deleteChip={handleOnDeleteFilter}
                deleteChipGroup={handleOnDeleteFilterGroup}
                categoryName={{ key: "owner", name: t("terms.owner") }}
                showToolbarItem
              >
                <SearchFilter
                  options={filterOptions}
                  onApplyFilter={handleOnFilterApplied}
                />
              </ToolbarFilter>
            </ToolbarGroup>
          }
          toolbar={
            <ToolbarGroup variant="button-group">
              <ToolbarItem>
                <Button
                  type="button"
                  aria-label="new-company"
                  variant={ButtonVariant.primary}
                  onClick={handleOnOpenCreateNewBusinessServiceModal}
                >
                  {t("actions.createNew")}
                </Button>
              </ToolbarItem>
            </ToolbarGroup>
          }
          noDataState={
            <EmptyState variant={EmptyStateVariant.small}>
              <EmptyStateIcon icon={AddCircleOIcon} />
              <Title headingLevel="h2" size="lg">
                No business services available
              </Title>
              <EmptyStateBody>
                Create a new business service to start seeing data here.
              </EmptyStateBody>
            </EmptyState>
          }
        />
      </ConditionalRender>

      <NewBusinessServiceModal
        isOpen={isNewBusinessServiceModalOpen}
        onSaved={handleOnBusinessServiceCreated}
        onCancel={handleOnCancelCreateBusinessService}
      />
      <UpdateBusinessServiceModal
        businessService={businessServiceToUpdate}
        onSaved={handleOnBusinessServiceUpdated}
        onCancel={handleOnCancelUpdateBusinessService}
      />
    </>
  );
};
