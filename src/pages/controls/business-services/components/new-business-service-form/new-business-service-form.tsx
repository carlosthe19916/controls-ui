import React from "react";
import { AxiosError, AxiosResponse } from "axios";
import { useFormik, FormikProvider, FormikHelpers } from "formik";
import { object, string } from "yup";

import {
  ActionGroup,
  Button,
  ButtonVariant,
  Form,
  FormGroup,
  TextArea,
  TextInput,
} from "@patternfly/react-core";

import { createBusinessService } from "api/rest";
import { BusinessService, Stakeholder } from "api/models";
import {
  getValidatedFromError,
  getValidatedFromErrorTouched,
} from "utils/utils";

import { SelectStakeholderFormField } from "../select-stakeholder-form-field";

export interface FormValues {
  name: string;
  description?: string;
  owner?: Stakeholder;
}

export interface NewBusinessServiceFormProps {
  businessService?: BusinessService;
  onSaved: (response: AxiosResponse<BusinessService>) => void;
  onSaveError: (error: AxiosError) => void;
  onCancel: () => void;
}

export const NewBusinessServiceForm: React.FC<NewBusinessServiceFormProps> = ({
  businessService,
  onSaved,
  onSaveError,
  onCancel,
}) => {
  const initialValues: FormValues = {
    name: businessService?.name || "",
    description: businessService?.description,
    owner: businessService?.owner,
  };

  const validationSchema = object().shape({
    name: string()
      .trim()
      .required("This field is required.")
      .min(3, "This field must contain at least 3 characters.")
      .max(120, "This field must contain fewer than 120 characters.")
      .matches(
        /^[- \w]+$/,
        "This field must contain only alphanumeric characters including underscore."
      ),
    description: string()
      .trim()
      .max(250, "This field must contain fewer than 250 characters."),
  });

  const onSubmit = (
    formValues: FormValues,
    formikHelpers: FormikHelpers<FormValues>
  ) => {
    const businessService: BusinessService = {
      name: formValues.name,
      description: formValues.description,
      owner: formValues.owner ? { ...formValues.owner } : undefined,
    };

    createBusinessService(businessService)
      .then((response) => {
        formikHelpers.setSubmitting(false);
        onSaved(response);
      })
      .catch((error) => {
        formikHelpers.setSubmitting(false);
        onSaveError(error);
      });
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: initialValues,
    validationSchema: validationSchema,
    onSubmit: onSubmit,
  });

  const onChangeField = (value: string, event: React.FormEvent<any>) => {
    formik.handleChange(event);
  };

  return (
    <FormikProvider value={formik}>
      <Form onSubmit={formik.handleSubmit}>
        <FormGroup
          label="Name"
          fieldId="name"
          isRequired={true}
          validated={getValidatedFromError(formik.errors.name)}
          helperTextInvalid={formik.errors.name}
        >
          <TextInput
            type="text"
            name="name"
            aria-label="name"
            aria-describedby="name"
            isRequired={true}
            onChange={onChangeField}
            onBlur={formik.handleBlur}
            value={formik.values.name}
            validated={getValidatedFromErrorTouched(
              formik.errors.name,
              formik.touched.name
            )}
            autoComplete="off"
          />
        </FormGroup>
        <FormGroup
          label="Description"
          fieldId="description"
          isRequired={false}
          validated={getValidatedFromError(formik.errors.description)}
          helperTextInvalid={formik.errors.description}
        >
          <TextArea
            type="text"
            name="description"
            aria-label="description"
            aria-describedby="description"
            isRequired={false}
            onChange={onChangeField}
            onBlur={formik.handleBlur}
            value={formik.values.description}
            validated={getValidatedFromErrorTouched(
              formik.errors.description,
              formik.touched.description
            )}
          />
        </FormGroup>
        <FormGroup
          label="Owner"
          fieldId="owner"
          isRequired={false}
          validated={getValidatedFromError(formik.errors.owner)}
          helperTextInvalid={formik.errors.owner}
        >
          <SelectStakeholderFormField name="owner" />
        </FormGroup>
        <ActionGroup>
          <Button
            type="submit"
            variant={ButtonVariant.primary}
            isDisabled={
              !formik.isValid ||
              !formik.dirty ||
              formik.isSubmitting ||
              formik.isValidating
            }
          >
            Save
          </Button>
          <Button
            variant={ButtonVariant.link}
            isDisabled={formik.isSubmitting || formik.isValidating}
            onClick={onCancel}
          >
            Cancel
          </Button>
        </ActionGroup>
      </Form>
    </FormikProvider>
  );
};
