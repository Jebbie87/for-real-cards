import { Injectable } from '@angular/core';
import { NgRedux } from 'ng2-redux';


import { IAppState, IPayloadAction } from '../../../common-app';
import {TopFrame} from "../../top-frame/top-frame.base";

@Injectable()
export class ForRealCardsActions {
  private static prefix = 'FRC_';
  static SET_TOPFRAME = ForRealCardsActions.prefix + 'SET_TOPFRAME';
  static NAV_TO_ENTER = ForRealCardsActions.prefix + 'NAV_TO_ENTER';
  static NAV_TO_PROFILE = ForRealCardsActions.prefix + 'NAV_TO_PROFILE';
  static NAV_TO_START = ForRealCardsActions.prefix + 'NAV_TO_START';
  static NAV_TO_TABLE = ForRealCardsActions.prefix + 'NAV_TO_TABLE';
  static NAV_TO_HAND = ForRealCardsActions.prefix + 'NAV_TO_HAND';

  constructor(private ngRedux: NgRedux<IAppState>) {
  }

  setTopFrame(topFrame:TopFrame) {
    this.ngRedux.dispatch({ type: ForRealCardsActions.SET_TOPFRAME, payload: {topFrame: topFrame}});
  }

  navigate(to:string) {
    this.ngRedux.dispatch({type:to});
  }
}