import { combineReducers } from "redux";
import { StateType } from "typesafe-actions";

import notifications from "@redhat-cloud-services/frontend-components-notifications/cjs/notifications";
import { confirmDialogStateKey, confirmDialogReducer } from "./confirmDialog";

export type RootState = StateType<typeof rootReducer>;

export const rootReducer = combineReducers({
  notifications: notifications,
  [confirmDialogStateKey]: confirmDialogReducer,
});
