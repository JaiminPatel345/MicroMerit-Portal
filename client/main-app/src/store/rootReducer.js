import { combineReducers } from "@reduxjs/toolkit";
import authLearner from "./authLearnerSlice"
import authIssuer from "./authIssuerSlice"
import authEmployer from "./authEmployerSlice"

const rootReducer = combineReducers({
  authIssuer,
  authLearner,
  authEmployer
});

export default rootReducer;
