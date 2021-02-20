import React, { useCallback, useEffect, useState } from "react";
import { AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";

import {
  Button,
  ButtonVariant,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
  Title,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import { cellWidth, ICell, sortable, TableText } from "@patternfly/react-table";
import { AddCircleOIcon } from "@patternfly/react-icons";

import { useDispatch } from "react-redux";
import { alertActions } from "store/alert";
import { confirmDialogActions } from "store/confirmDialog";

import {
  AppPlaceholder,
  ConditionalRender,
  AppTableWithControls,
  SearchFilter,
  AppTableActionButtons,
  AppTableToolbarToggleGroup,
} from "shared/components";
import {
  useTableControls,
  useFetchBusinessServices,
  useDeleteBusinessService,
} from "shared/hooks";

import { BusinessService, SortByQuery } from "api/models";
import { BusinessServiceSortBy, BusinessServiceSortByQuery } from "api/rest";
import { getAxiosErrorMessage } from "utils/utils";

import { NewBusinessServiceModal } from "./components/new-business-service-modal";
import { UpdateBusinessServiceModal } from "./components/update-business-service-modal";

enum FilterKey {
  NAME = "name",
  DESCRIPTION = "description",
  OWNER = "owner",
}

const toSortByQuery = (
  sortBy?: SortByQuery
): BusinessServiceSortByQuery | undefined => {
  if (!sortBy) {
    return undefined;
  }

  let field: BusinessServiceSortBy;
  switch (sortBy.index) {
    case 0:
      field = BusinessServiceSortBy.NAME;
      break;
    case 2:
      field = BusinessServiceSortBy.OWNER;
      break;
    default:
      throw new Error("Invalid column index=" + sortBy.index);
  }

  return {
    field,
    direction: sortBy.direction,
  };
};

const ENTITY_FIELD = "entity";

// const getRow = (rowData: IRowData): BusinessService => {
//   return rowData[BUSINESS_SERVICE_FIELD];
// };

export const BusinessServices: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const filters = [
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
  const [filtersValue, setFiltersValue] = useState<Map<FilterKey, string[]>>(
    new Map([])
  );

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
    handlePaginationChange,
    handleSortChange,
  } = useTableControls({
    sortByQuery: { direction: "asc", index: 0 },
  });

  const refreshTable = useCallback(() => {
    fetchBusinessServices(
      {
        name: filtersValue.get(FilterKey.NAME),
        description: filtersValue.get(FilterKey.DESCRIPTION),
        owner: filtersValue.get(FilterKey.OWNER),
      },
      paginationQuery,
      toSortByQuery(sortByQuery)
    );
  }, [filtersValue, paginationQuery, sortByQuery, fetchBusinessServices]);

  useEffect(() => {
    fetchBusinessServices(
      {
        name: filtersValue.get(FilterKey.NAME),
        description: filtersValue.get(FilterKey.DESCRIPTION),
        owner: filtersValue.get(FilterKey.OWNER),
      },
      paginationQuery,
      toSortByQuery(sortByQuery)
    );
  }, [filtersValue, paginationQuery, sortByQuery, fetchBusinessServices]);

  const columns: ICell[] = [
    { title: t("terms.name"), transforms: [sortable, cellWidth(30)] },
    { title: t("terms.description"), transforms: [cellWidth(40)] },
    { title: t("terms.owner"), transforms: [sortable] },
    {
      title: "",
      props: {
        className: "pf-u-text-align-right",
      },
    },
  ];

  const itemsToRow = (items: BusinessService[]) => {
    return items.map((item) => ({
      [ENTITY_FIELD]: item,
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
        {
          title: (
            <AppTableActionButtons
              onEdit={() => editRow(item)}
              onDelete={() => deleteRow(item)}
            />
          ),
        },
      ],
    }));
  };

  // const actions: IActions = [
  //   {
  //     title: t("actions.edit"),
  //     onClick: (
  //       event: React.MouseEvent,
  //       rowIndex: number,
  //       rowData: IRowData
  //     ) => {
  //       const row: BusinessService = getRow(rowData);
  //       editRow(row);
  //     },
  //   },
  //   {
  //     title: t("actions.delete"),
  //     onClick: (
  //       event: React.MouseEvent,
  //       rowIndex: number,
  //       rowData: IRowData
  //     ) => {
  //       const row: BusinessService = getRow(rowData);
  //       deleteRow(row);
  //     },
  //   },
  // ];

  const editRow = (row: BusinessService) => {
    setRowToUpdate(row);
  };

  const deleteRow = (row: BusinessService) => {
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
              dispatch(alertActions.addDanger(getAxiosErrorMessage(error)));
            }
          );
        },
      })
    );
  };

  // Advanced filters

  const handleOnClearAllFilters = () => {
    setFiltersValue((current) => {
      const newVal = new Map(current);
      Array.from(newVal.keys()).forEach((key) => {
        newVal.set(key, []);
      });
      return newVal;
    });
  };

  const handleOnAddFilter = (key: string, filterText: string) => {
    const filterKey: FilterKey = key as FilterKey;
    setFiltersValue((current) => {
      const values: string[] = current.get(filterKey) || [];
      return new Map(current).set(filterKey, [...values, filterText]);
    });

    handlePaginationChange({ page: 1 });
  };

  const handleOnDeleteFilter = (key: string, value: string[]) => {
    const filterKey: FilterKey = key as FilterKey;
    setFiltersValue((current) => new Map(current).set(filterKey, value));
  };

  // Create Modal

  const handleOnOpenCreateNewBusinessServiceModal = () => {
    setIsNewModalOpen(true);
  };

  const handleOnBusinessServiceCreated = (
    response: AxiosResponse<BusinessService>
  ) => {
    setIsNewModalOpen(false);
    refreshTable();

    dispatch(
      alertActions.addSuccess(
        t("toastr.success.added", {
          what: response.data.name,
          type: "business service",
        })
      )
    );
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
          sortBy={sortByQuery}
          handlePaginationChange={handlePaginationChange}
          handleSortChange={handleSortChange}
          columns={columns}
          // actions={actions}
          isLoading={isFetching}
          loadingVariant="skeleton"
          fetchError={fetchError}
          clearAllFilters={handleOnClearAllFilters}
          filtersApplied={
            Array.from(filtersValue.values()).reduce(
              (current, accumulator) => [...accumulator, ...current],
              []
            ).length > 0
          }
          toolbarToggle={
            <AppTableToolbarToggleGroup
              options={filters}
              filtersValue={filtersValue}
              onDeleteFilter={handleOnDeleteFilter}
            >
              <SearchFilter
                options={filters}
                onApplyFilter={handleOnAddFilter}
              />
            </AppTableToolbarToggleGroup>
          }
          toolbar={
            <ToolbarGroup variant="button-group">
              <ToolbarItem>
                <Button
                  type="button"
                  aria-label="create-business-service"
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
