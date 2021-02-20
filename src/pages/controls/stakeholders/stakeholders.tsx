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
  ToolbarChip,
  ToolbarChipGroup,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import { ICell, sortable } from "@patternfly/react-table";
import { AddCircleOIcon } from "@patternfly/react-icons";

import { useDispatch } from "react-redux";
import { alertActions } from "store/alert";
import { confirmDialogActions } from "store/confirmDialog";

import {
  AppPlaceholder,
  AppTableActionButtons,
  AppTableWithControls,
  ConditionalRender,
  SearchFilter,
  AppTableToolbarToggleGroup,
} from "shared/components";
import {
  useTableControls,
  useFetchStakeholders,
  useDeleteStakeholder,
} from "shared/hooks";

import { getAxiosErrorMessage } from "utils/utils";
import { StakeholderSortBy, StakeholderSortByQuery } from "api/rest";
import { Stakeholder, SortByQuery } from "api/models";

import { NewStakeholderModal } from "./components/new-stakeholder-modal";
import { UpdateStakeholderModal } from "./components/update-stakeholder-modal";

enum FilterKey {
  EMAIL = "email",
  DISPLAY_NAME = "displayName",
  JOB_FUNCTION = "jobFunction",
  GROUPS = "groups",
}

const toSortByQuery = (
  sortBy?: SortByQuery
): StakeholderSortByQuery | undefined => {
  if (!sortBy) {
    return undefined;
  }

  let field: StakeholderSortBy;
  switch (sortBy.index) {
    case 0:
      field = StakeholderSortBy.EMAIL;
      break;
    case 1:
      field = StakeholderSortBy.DISPLAY_NAME;
      break;
    case 2:
      field = StakeholderSortBy.JOB_FUNCTION;
      break;
    case 3:
      field = StakeholderSortBy.GROUP;
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

export const Stakeholders: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const filters = [
    {
      key: FilterKey.EMAIL,
      name: t("terms.email"),
    },
    {
      key: FilterKey.DISPLAY_NAME,
      name: t("terms.displayName"),
    },
    {
      key: FilterKey.JOB_FUNCTION,
      name: t("terms.jobFunction"),
    },
    {
      key: FilterKey.GROUPS,
      name: t("terms.group"),
    },
  ];

  const [filtersValue, setFiltersValue] = useState<Map<FilterKey, string[]>>(
    new Map([])
  );

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [rowToUpdate, setRowToUpdate] = useState<Stakeholder>();

  const { deleteStakeholder } = useDeleteStakeholder();

  const {
    stakeholders,
    isFetching,
    fetchError,
    fetchStakeholders,
  } = useFetchStakeholders(true);

  const {
    paginationQuery,
    sortByQuery,
    handlePaginationChange,
    handleSortChange,
  } = useTableControls({
    sortByQuery: { direction: "asc", index: 0 },
  });

  const refreshTable = useCallback(() => {
    fetchStakeholders(
      {
        email: filtersValue.get(FilterKey.EMAIL),
        displayName: filtersValue.get(FilterKey.DISPLAY_NAME),
        jobFuction: filtersValue.get(FilterKey.JOB_FUNCTION),
        group: filtersValue.get(FilterKey.GROUPS),
      },
      paginationQuery,
      toSortByQuery(sortByQuery)
    );
  }, [filtersValue, paginationQuery, sortByQuery, fetchStakeholders]);

  useEffect(() => {
    fetchStakeholders(
      {
        email: filtersValue.get(FilterKey.EMAIL),
        displayName: filtersValue.get(FilterKey.DISPLAY_NAME),
        jobFuction: filtersValue.get(FilterKey.JOB_FUNCTION),
        group: filtersValue.get(FilterKey.GROUPS),
      },
      paginationQuery,
      toSortByQuery(sortByQuery)
    );
  }, [filtersValue, paginationQuery, sortByQuery, fetchStakeholders]);

  const columns: ICell[] = [
    { title: t("terms.email"), transforms: [sortable] },
    { title: t("terms.displayName"), transforms: [sortable] },
    { title: t("terms.jobFunction"), transforms: [sortable] },
    { title: t("terms.group(s)"), transforms: [sortable] },
    {
      title: "",
      props: {
        className: "pf-u-text-align-right",
      },
    },
  ];

  const itemsToRow = (items: Stakeholder[]) => {
    return items.map((item) => ({
      [ENTITY_FIELD]: item,
      cells: [
        {
          title: item.email,
        },
        {
          title: item.displayName,
        },
        {
          title: item.jobFunction,
        },
        {
          title: item.groups,
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

  const editRow = (row: Stakeholder) => {
    setRowToUpdate(row);
  };

  const deleteRow = (row: Stakeholder) => {
    dispatch(
      confirmDialogActions.openDialog({
        title: t("dialog.title.delete", { what: row.displayName }),
        message: t("dialog.message.delete", { what: row.displayName }),
        variant: ButtonVariant.danger,
        confirmBtnLabel: t("actions.delete"),
        cancelBtnLabel: t("actions.cancel"),
        onConfirm: () => {
          dispatch(confirmDialogActions.processing());
          deleteStakeholder(
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

  const handleOnOpenCreateNewModal = () => {
    setIsNewModalOpen(true);
  };

  const handleOnCreatedNew = (response: AxiosResponse<Stakeholder>) => {
    setIsNewModalOpen(false);
    refreshTable();

    dispatch(
      alertActions.addSuccess(
        t("toastr.success.added", {
          what: response.data.displayName,
          type: "business service",
        })
      )
    );
  };

  const handleOnCreateNewCancel = () => {
    setIsNewModalOpen(false);
  };

  // Update Modal

  const handleOnUpdated = () => {
    setRowToUpdate(undefined);
    refreshTable();
  };

  const handleOnUpdatedCancel = () => {
    setRowToUpdate(undefined);
  };

  return (
    <>
      <ConditionalRender
        when={isFetching && !(stakeholders || fetchError)}
        then={<AppPlaceholder />}
      >
        <AppTableWithControls
          count={stakeholders ? stakeholders.meta.count : 0}
          items={stakeholders ? stakeholders.data : []}
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
                  aria-label="create-stakeholder"
                  variant={ButtonVariant.primary}
                  onClick={handleOnOpenCreateNewModal}
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
                No stakeholders available
              </Title>
              <EmptyStateBody>
                Create a new stakeholder to start seeing data here.
              </EmptyStateBody>
            </EmptyState>
          }
        />
      </ConditionalRender>

      <NewStakeholderModal
        isOpen={isNewModalOpen}
        onSaved={handleOnCreatedNew}
        onCancel={handleOnCreateNewCancel}
      />
      <UpdateStakeholderModal
        stakeholder={rowToUpdate}
        onSaved={handleOnUpdated}
        onCancel={handleOnUpdatedCancel}
      />
    </>
  );
};
