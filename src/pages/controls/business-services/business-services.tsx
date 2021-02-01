import React, { useCallback, useEffect, useState } from "react";
import { AxiosError, AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";

import {
  Button,
  ButtonVariant,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
  Modal,
  ModalVariant,
  PageSection,
  Title,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  IActions,
  ICell,
  IExtraColumnData,
  IExtraData,
  IRowData,
  sortable,
  SortByDirection,
} from "@patternfly/react-table";
import { AddCircleOIcon } from "@patternfly/react-icons";

import { useDispatch } from "react-redux";
import { alertActions } from "store/alert";
import { confirmDialogActions } from "store/confirmDialog";

import {
  AppPlaceholder,
  ConditionalRender,
  AppTableWithControls,
  SearchInput,
} from "shared/components";
import {
  useTableControls,
  useFetchBusinessServices,
  useDeleteBusinessService,
} from "shared/hooks";

import { BusinessService, PageQuery, SortByQuery } from "api/models";
import { getAxiosErrorMessage } from "utils/utils";
import { NewBusinessServiceForm } from "./components/new-business-service-form";

const columnIndexToField = (
  _: React.MouseEvent,
  index: number,
  direction: SortByDirection,
  extraData: IExtraColumnData
) => {
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
        title: item.description,
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

  const [filterText, setFilterText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    (filterText: string, pagination: PageQuery, sortBy?: SortByQuery) => {
      fetchBusinessServices({ filterText }, pagination, sortBy);
    },
    [fetchBusinessServices]
  );

  useEffect(() => {
    reloadTable(filterText, paginationQuery, sortByQuery);
  }, [filterText, paginationQuery, sortByQuery, reloadTable]);

  const columns: ICell[] = [
    { title: t("terms.name"), transforms: [sortable] },
    { title: t("terms.description") },
    { title: t("terms.owner"), transforms: [sortable] },
  ];

  const actions: IActions = [
    {
      title: t("actions.delete"),
      onClick: (
        event: React.MouseEvent,
        rowIndex: number,
        rowData: IRowData,
        extraData: IExtraData
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
                  reloadTable(filterText, paginationQuery, sortByQuery);
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

  const handleOnSearch = (filterText: string) => {
    setFilterText(filterText);
    handlePaginationChange({ page: 1 });
  };

  const handleOnCreateNew = () => {
    setIsModalOpen(true);
  };

  const handleOnModalClose = () => {
    setIsModalOpen(false);
  };

  const handleOnBusinessServiceSaved = (
    response: AxiosResponse<BusinessService>
  ) => {
    handleOnModalClose();
    reloadTable(filterText, paginationQuery, sortByQuery);
  };

  const onBusinessServiceSaveError = (error: AxiosError) => {
    handleOnModalClose();
    alertActions.addAlert("danger", "Error", getAxiosErrorMessage(error));
  };

  return (
    <PageSection>
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
          filtersApplied={filterText.length > 0}
          toolbar={
            <>
              <ToolbarGroup>
                <ToolbarItem>
                  <SearchInput onSearch={handleOnSearch} placeholder="Filter" />
                </ToolbarItem>
              </ToolbarGroup>
              <ToolbarGroup variant="button-group">
                <ToolbarItem>
                  <Button
                    type="button"
                    aria-label="new-company"
                    variant={ButtonVariant.primary}
                    onClick={handleOnCreateNew}
                  >
                    {t("actions.createNew")}
                  </Button>
                </ToolbarItem>
              </ToolbarGroup>
            </>
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
      <Modal
        title={t("dialog.title.newBusinessService")}
        variant={ModalVariant.medium}
        isOpen={isModalOpen}
        onClose={handleOnModalClose}
      >
        <NewBusinessServiceForm
          onSaved={handleOnBusinessServiceSaved}
          onSaveError={onBusinessServiceSaveError}
          onCancel={handleOnModalClose}
        />
      </Modal>
    </PageSection>
  );
};
