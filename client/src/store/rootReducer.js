import { combineReducers } from "@reduxjs/toolkit";
import authLearner from  "./authLearnerSlice"
import authIssuer from  "./authIssuerSlice"

const rootReducer = combineReducers({
  authIssuer,
  authLearner
});

export default rootReducer;
