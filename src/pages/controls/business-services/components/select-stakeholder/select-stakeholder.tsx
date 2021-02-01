import React, { useCallback, useState } from "react";

import {
  Select,
  SelectOption,
  SelectOptionObject,
  SelectVariant,
} from "@patternfly/react-core";
import { SpinnerIcon } from "@patternfly/react-icons";

import { Stakeholder } from "api/models";
import { useFetchStakeholders } from "shared/hooks";

interface SelectOptionStakeholder extends SelectOptionObject {
  stakeholder: Stakeholder;
}

const selectOptionMapper = (
  stakeholder: Stakeholder
): SelectOptionStakeholder => ({
  stakeholder: { ...stakeholder },
  toString: () => stakeholder.displayName,
});

export interface SelectStakeholderProps {
  value?: Stakeholder;
  onSelect: (value: Stakeholder) => void;
}

export const SelectStakeholder: React.FC<SelectStakeholderProps> = ({
  value,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    stakeholders,
    isFetching,
    fetchAllStakeholders,
  } = useFetchStakeholders();

  const handleOnToggle = useCallback(
    (isOpen: boolean) => {
      setIsOpen(isOpen);
      if (isOpen) {
        fetchAllStakeholders();
      }
    },
    [fetchAllStakeholders]
  );

  const handleOnSelect = (
    event: React.MouseEvent | React.ChangeEvent,
    selection: string | SelectOptionObject
  ) => {
    if (typeof selection === "string") {
      throw new Error("This selection is not allowed");
    }

    setIsOpen(false);

    const selectedOption = selection as SelectOptionStakeholder;
    onSelect(selectedOption.stakeholder);
  };

  return (
    <Select
      toggleIcon={isFetching ? <SpinnerIcon /> : undefined}
      variant={SelectVariant.typeahead}
      onToggle={handleOnToggle}
      onSelect={handleOnSelect}
      selections={value ? value.displayName : undefined}
      isOpen={isOpen}
      menuAppendTo={window.document.body}
    >
      {stakeholders?.data
        .map((f) => selectOptionMapper(f))
        .map((elem, index) => (
          <SelectOption key={index} value={elem}>
            {elem.stakeholder.displayName}
          </SelectOption>
        ))}
    </Select>
  );
};
