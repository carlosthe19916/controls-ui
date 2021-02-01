import React from "react";
import { Story, Meta } from "@storybook/react/types-6-0";
import {
  NewBusinessServiceForm,
  NewBusinessServiceFormProps,
} from "../new-business-service-form";
import { Modal } from "@patternfly/react-core";

export default {
  title: "Components / NewBusinessServiceForm",
  component: NewBusinessServiceForm,
  argTypes: {
    onCancel: { action: "onCancel" },
  },
} as Meta;

const Template: Story<NewBusinessServiceFormProps> = (args) => (
  <NewBusinessServiceForm {...args} />
);

const TemplateModal: Story<NewBusinessServiceFormProps> = (args) => (
  <Modal isOpen={true} title="My modal title">
    <NewBusinessServiceForm {...args} />
  </Modal>
);

export const Basic = Template.bind({});

export const InModal = TemplateModal.bind({});
