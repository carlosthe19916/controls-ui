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

import { BusinessService } from "api/models";
import { getAxiosErrorMessage } from "utils/utils";

import { NewBusinessServiceModal } from "./components/new-business-service-modal";
import { UpdateBusinessServiceModal } from "./components/update-business-service-modal";
import {
  FilterOption,
  SearchFilter,
} from "./components/search-filter/search-filter";

enum FilterKey {
  NAME = "name",
  DESCRIPTION = "description",
  OWNER = "owner",
}

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
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [nameFilters, setNameFilters] = useState<string[]>([]);
  const [descriptionFilters, setDescriptionFilters] = useState<string[]>([]);
  const [ownerFilters, setOwnerFilters] = useState<string[]>([]);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [rowToUpdate, setRowToUpdate] = useState<BusinessService>();

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

  const refreshTable = useCallback(() => {
    fetchBusinessServices(
      {
        name: nameFilters,
        description: descriptionFilters,
        owner: ownerFilters,
      },
      paginationQuery,
      sortByQuery
    );
  }, [
    nameFilters,
    descriptionFilters,
    ownerFilters,
    paginationQuery,
    sortByQuery,
    fetchBusinessServices,
  ]);

  useEffect(() => {
    fetchBusinessServices(
      {
        name: nameFilters,
        description: descriptionFilters,
        owner: ownerFilters,
      },
      paginationQuery,
      sortByQuery
    );
  }, [
    nameFilters,
    descriptionFilters,
    ownerFilters,
    paginationQuery,
    sortByQuery,
    fetchBusinessServices,
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
        setRowToUpdate(row);
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
                  refreshTable();
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

  // Advanced filters

  const filterOptions: FilterOption[] = [
    {
      key: FilterKey.NAME,
      name: t("terms.name"),
    },
    {
      key: FilterKey.DESCRIPTION,
      name: t("terms.description"),
    },
    {
      key: FilterKey.OWNER,
      name: t("terms.owner"),
    },
  ];

  const handleOnClearAllFilters = () => {
    setNameFilters([]);
    setDescriptionFilters([]);
    setOwnerFilters([]);
  };

  const handleOnFilterApplied = (key: string, filterText: string) => {
    if (key === FilterKey.NAME) {
      setNameFilters([...nameFilters, filterText]);
    } else if (key === FilterKey.DESCRIPTION) {
      setDescriptionFilters([...descriptionFilters, filterText]);
    } else if (key === FilterKey.OWNER) {
      setOwnerFilters([...ownerFilters, filterText]);
    } else {
      throw new Error("Can not apply filter " + key + ". It's not supported");
    }

    handlePaginationChange({ page: 1 });
  };

  const handleOnDeleteFilter = (
    category: string | ToolbarChipGroup,
    chip: ToolbarChip | string
  ) => {
    if (typeof chip !== "string") {
      throw new Error("Can not delete filter. Chip must be a string");
    }

    let categoryKey: string;
    if (typeof category === "string") {
      categoryKey = category;
    } else {
      categoryKey = category.key;
    }

    if (categoryKey === FilterKey.NAME) {
      setNameFilters(nameFilters.filter((f) => f !== chip));
    } else if (categoryKey === FilterKey.DESCRIPTION) {
      setDescriptionFilters(descriptionFilters.filter((f) => f !== chip));
    } else if (categoryKey === FilterKey.OWNER) {
      setOwnerFilters(ownerFilters.filter((f) => f !== chip));
    } else {
      throw new Error(
        "Can not delete chip. Chip " + chip + " is not supported"
      );
    }
  };

  const handleOnDeleteFilterGroup = (category: string | ToolbarChipGroup) => {
    let categoryKey: string;
    if (typeof category === "string") {
      categoryKey = category;
    } else {
      categoryKey = category.key;
    }

    if (categoryKey === FilterKey.NAME) {
      setNameFilters([]);
    } else if (categoryKey === FilterKey.DESCRIPTION) {
      setDescriptionFilters([]);
    } else if (categoryKey === FilterKey.OWNER) {
      setOwnerFilters([]);
    } else {
      throw new Error("Can not delete ChipGroup. ChipGroup is not supported");
    }
  };

  // Create Modal

  const handleOnOpenCreateNewBusinessServiceModal = () => {
    setIsNewModalOpen(true);
  };

  const handleOnBusinessServiceCreated = () => {
    setIsNewModalOpen(false);
    refreshTable();
  };

  const handleOnCancelCreateBusinessService = () => {
    setIsNewModalOpen(false);
  };

  // Update Modal

  const handleOnBusinessServiceUpdated = () => {
    setRowToUpdate(undefined);
    refreshTable();
  };

  const handleOnCancelUpdateBusinessService = () => {
    setRowToUpdate(undefined);
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
            nameFilters.length +
              descriptionFilters.length +
              ownerFilters.length >
            0
          }
          toolbarToggle={
            <ToolbarGroup variant="filter-group">
              <ToolbarFilter
                chips={nameFilters}
                deleteChip={handleOnDeleteFilter}
                deleteChipGroup={handleOnDeleteFilterGroup}
                categoryName={{ key: FilterKey.NAME, name: t("terms.name") }}
                showToolbarItem
              >
                {null}
              </ToolbarFilter>
              <ToolbarFilter
                chips={descriptionFilters}
                deleteChip={handleOnDeleteFilter}
                deleteChipGroup={handleOnDeleteFilterGroup}
                categoryName={{
                  key: FilterKey.DESCRIPTION,
                  name: t("terms.description"),
                }}
                showToolbarItem
              >
                {null}
              </ToolbarFilter>
              <ToolbarFilter
                chips={ownerFilters}
                deleteChip={handleOnDeleteFilter}
                deleteChipGroup={handleOnDeleteFilterGroup}
                categoryName={{ key: FilterKey.OWNER, name: t("terms.owner") }}
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
        isOpen={isNewModalOpen}
        onSaved={handleOnBusinessServiceCreated}
        onCancel={handleOnCancelCreateBusinessService}
      />
      <UpdateBusinessServiceModal
        businessService={rowToUpdate}
        onSaved={handleOnBusinessServiceUpdated}
        onCancel={handleOnCancelUpdateBusinessService}
      />
    </>
  );
};
