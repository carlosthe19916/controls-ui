import React from "react";

import { FieldHookConfig, useField } from "formik";

import { Stakeholder } from "api/models";
import { SelectStakeholder } from "../select-stakeholder/select-stakeholder";

export const SelectStakeholderFormField: React.FC<
  FieldHookConfig<Stakeholder | undefined>
> = ({ ...props }) => {
  const [field, , helpers] = useField(props);

  const handleOnSelect = (value: Stakeholder) => {
    helpers.setValue(value);
  };

  return <SelectStakeholder value={field.value} onSelect={handleOnSelect} />;
};
