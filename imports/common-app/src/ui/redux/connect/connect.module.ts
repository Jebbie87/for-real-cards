import {Injectable} from "@angular/core";

import { ReduxModule} from '../redux-module.class';
import { connectReducer } from "./connect-reducer";
import { ConnectAsync } from "./connect-async.class";
import { IAppState } from "../state.interface";
import { IPayloadAction } from "../action.interface";
import { ConnectActions } from "./connect-actions.class";

@Injectable()
export class ConnectModule extends ReduxModule<IAppState, IPayloadAction>  {
  reducers=[{name:'connectReducer', reducer:connectReducer}];
  actions = ConnectActions;
  constructor(private connectEpics:ConnectAsync) {
    super();
    this.epics.push(
      connectEpics.attempt,
      connectEpics.connect,
      connectEpics.setNewServer
    );
  }

  initialize():void {}
}