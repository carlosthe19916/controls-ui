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
  Flex,
  FlexItem,
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
  ConditionalRender,
  AppTableWithControls,
  SearchFilter,
} from "shared/components";
import {
  useTableControls,
  useFetchStakeholders,
  useDeleteStakeholder,
} from "shared/hooks";

import { Stakeholder, SortByQuery } from "api/models";
import { StakeholderSortBy, StakeholderSortByQuery } from "api/rest";
import { getAxiosErrorMessage } from "utils/utils";

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

  const [emailFilters, setEmailFilters] = useState<string[]>([]);
  const [displayNameFilters, setDisplayNameFilters] = useState<string[]>([]);
  const [jobFunctionFilters, setJobFunctionFilters] = useState<string[]>([]);
  const [groupFilters, setGroupFilters] = useState<string[]>([]);

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
        email: emailFilters,
        displayName: displayNameFilters,
        jobFuction: jobFunctionFilters,
        group: groupFilters,
      },
      paginationQuery,
      toSortByQuery(sortByQuery)
    );
  }, [
    emailFilters,
    displayNameFilters,
    jobFunctionFilters,
    groupFilters,
    paginationQuery,
    sortByQuery,
    fetchStakeholders,
  ]);

  useEffect(() => {
    fetchStakeholders(
      {
        email: emailFilters,
        displayName: displayNameFilters,
        jobFuction: jobFunctionFilters,
        group: groupFilters,
      },
      paginationQuery,
      toSortByQuery(sortByQuery)
    );
  }, [
    emailFilters,
    displayNameFilters,
    jobFunctionFilters,
    groupFilters,
    paginationQuery,
    sortByQuery,
    fetchStakeholders,
  ]);

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
            <Flex>
              <FlexItem align={{ default: "alignRight" }}>
                <Button
                  aria-label="edit"
                  variant="secondary"
                  onClick={() => editRow(item)}
                >
                  {t("actions.edit")}
                </Button>
              </FlexItem>
              <FlexItem>
                <Button
                  aria-label="delete"
                  variant="link"
                  onClick={() => deleteRow(item)}
                >
                  {t("actions.delete")}
                </Button>
              </FlexItem>
            </Flex>
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

  const filterOptions = [
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

  const handleOnClearAllFilters = () => {
    setEmailFilters([]);
    setDisplayNameFilters([]);
    setJobFunctionFilters([]);
    setGroupFilters([]);
  };

  const handleOnFilterApplied = (key: string, filterText: string) => {
    if (key === FilterKey.EMAIL) {
      setEmailFilters([...emailFilters, filterText]);
    } else if (key === FilterKey.DISPLAY_NAME) {
      setDisplayNameFilters([...displayNameFilters, filterText]);
    } else if (key === FilterKey.JOB_FUNCTION) {
      setJobFunctionFilters([...jobFunctionFilters, filterText]);
    } else if (key === FilterKey.GROUPS) {
      setGroupFilters([...groupFilters, filterText]);
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

    if (categoryKey === FilterKey.EMAIL) {
      setEmailFilters(emailFilters.filter((f) => f !== chip));
    } else if (categoryKey === FilterKey.DISPLAY_NAME) {
      setDisplayNameFilters(displayNameFilters.filter((f) => f !== chip));
    } else if (categoryKey === FilterKey.JOB_FUNCTION) {
      setJobFunctionFilters(jobFunctionFilters.filter((f) => f !== chip));
    } else if (categoryKey === FilterKey.GROUPS) {
      setJobFunctionFilters(groupFilters.filter((f) => f !== chip));
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

    if (categoryKey === FilterKey.EMAIL) {
      setEmailFilters([]);
    } else if (categoryKey === FilterKey.DISPLAY_NAME) {
      setDisplayNameFilters([]);
    } else if (categoryKey === FilterKey.JOB_FUNCTION) {
      setJobFunctionFilters([]);
    } else if (categoryKey === FilterKey.GROUPS) {
      setJobFunctionFilters([]);
    } else {
      throw new Error("Can not delete ChipGroup. ChipGroup is not supported");
    }
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
            emailFilters.length +
              displayNameFilters.length +
              jobFunctionFilters.length +
              groupFilters.length >
            0
          }
          toolbarToggle={
            <ToolbarGroup variant="filter-group">
              <ToolbarFilter
                chips={emailFilters}
                deleteChip={handleOnDeleteFilter}
                deleteChipGroup={handleOnDeleteFilterGroup}
                categoryName={{ key: FilterKey.EMAIL, name: t("terms.email") }}
                showToolbarItem
              >
                {null}
              </ToolbarFilter>
              <ToolbarFilter
                chips={displayNameFilters}
                deleteChip={handleOnDeleteFilter}
                deleteChipGroup={handleOnDeleteFilterGroup}
                categoryName={{
                  key: FilterKey.DISPLAY_NAME,
                  name: t("terms.displayName"),
                }}
                showToolbarItem
              >
                {null}
              </ToolbarFilter>
              <ToolbarFilter
                chips={jobFunctionFilters}
                deleteChip={handleOnDeleteFilter}
                deleteChipGroup={handleOnDeleteFilterGroup}
                categoryName={{
                  key: FilterKey.JOB_FUNCTION,
                  name: t("terms.jobFunction"),
                }}
                showToolbarItem
              >
                {null}
              </ToolbarFilter>
              <ToolbarFilter
                chips={groupFilters}
                deleteChip={handleOnDeleteFilter}
                deleteChipGroup={handleOnDeleteFilterGroup}
                categoryName={{
                  key: FilterKey.GROUPS,
                  name: t("terms.group"),
                }}
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
                  aria-label="create-business-service"
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
