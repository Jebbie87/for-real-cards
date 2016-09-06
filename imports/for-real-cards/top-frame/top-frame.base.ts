/**
 * Copyright Ken Ono, Fabrica Technolology 2016
 * Source code license under Creative Commons - Attribution-NonCommercial 2.0 Canada (CC BY-NC 2.0 CA)
 */
import {NgRedux} from "ng2-redux";

import { IAppState, IPayloadAction, BaseApp, ConnectModule, LoginActions, LoginModule, UploaderModule, UsersModule} from "../../common-app";
import {ForRealCardsModule, ForRealCardsActions, GamePlayModule, IForRealCardsActionPayload} from "../ui";

export abstract class TopFrame extends BaseApp<IAppState> {
  private loginModule:LoginModule;
  topFrameConfigure(
    connectModule:ConnectModule,
    loginModule:LoginModule,
    forRealCardsModule:ForRealCardsModule,
    gamePlayModule:GamePlayModule,
    usersModule:UsersModule,
    uploaderModule:UploaderModule,
    ngRedux: NgRedux<IAppState>
  ) {
    this.turnOnConsoleLogging();

    // Middleware put here so it can have access to 'this.'.  This is a temporary work around until navigation with redux is done
    const navigatorMiddleware = store => next => (action:IPayloadAction) => {
      switch (action.type)  {
        case LoginActions.LOGGED_IN:
          if (!action.payload.autoLogin)
            this.navigateToEnter();
          break;
        case LoginActions.LOGGED_OUT:
          this.navigateToStart();
          break;
        case ForRealCardsActions.NAV_TO_ENTER:
          this.navigateToEnter();
          break;
        case ForRealCardsActions.NAV_TO_START:
          this.navigateToStart();
          break;
        case ForRealCardsActions.NAV_TO_HAND:
          this.navigateToGamePlayer(action.payload.gameId);
          break;
        case ForRealCardsActions.NAV_TO_TABLE:
          this.navigateToGameTable(action.payload.gameId);
          break;
        case ForRealCardsActions.ENTER_GAME_FAIL:
          this.navigateToEnter();
          break;
        case ForRealCardsActions.JOIN_GAME_SUCCESS: {
          let forRealCardsPayload: IForRealCardsActionPayload = action.payload;
          this.navigateToGamePlayer(forRealCardsPayload.gameId);
          break;
        }
        case ForRealCardsActions.VIEW_GAME_SUCCESS: {
          let forRealCardsPayload: IForRealCardsActionPayload = action.payload;
          this.navigateToGameTable(forRealCardsPayload.gameId);
          break;
        }
      }
      return next(action);
    };

    forRealCardsModule.middlewares.push(navigatorMiddleware);
    this.configure([connectModule, loginModule, forRealCardsModule, gamePlayModule, uploaderModule, usersModule], ngRedux);
    this.loginModule = loginModule;
    loginModule.actions.watchUser(); // for auto login
  }

  ngOnInit() {
    console.log('ngOnInit of TopFrame ' + new Date())
   // this.loginModule.actions.watchUser();  // TODO: DELETE THIS i DONT' THINK ITS NEEDED
  }


  abstract navigateToStart():void;
  abstract navigateToEnter():void;
  abstract navigateToGameTable(gameId:string):void;
  abstract navigateToGamePlayer(gameId:string):void;

}