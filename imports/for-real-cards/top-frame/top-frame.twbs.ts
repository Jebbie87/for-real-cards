/**
 * Copyright Ken Ono, Fabrica Technolology 2016
 * Source code license under Creative Commons - Attribution-NonCommercial 2.0 Canada (CC BY-NC 2.0 CA)
 */
import { Meteor } from 'meteor/meteor';
import { Component, provide, NgZone } from '@angular/core';
import { LocationStrategy, HashLocationStrategy, APP_BASE_HREF } from '@angular/common';
import { bootstrap } from '@angular/platform-browser-dynamic';
import { Routes, Router, ROUTER_DIRECTIVES, ROUTER_PROVIDERS } from '@angular/router'
import { DragulaService} from 'ng2-dragula/ng2-dragula';

import {  Menus, MenuItem,  UserEventType, UserEvent} from '../../common-app/api/index';
import { AccountsAdmin } from '../../common-app/ui-twbs-ng2/accounts-admin/accounts-admin';

import { ModalDialog } from "../../common-app/ui-twbs-ng2/modal/modal.component";
import { DealModal } from "../deal-modal/deal-modal.twbs";
import { EditUserProfileTWBS } from '../edit-user-profile/edit-user-profile.twbs';
import { EnterGame } from '../enter-game/enter-game';
import { GameActionList } from '../debug-tools/game-action-list';
import { PopoverMenu } from '../../common-app/ui-twbs-ng2/index';
import { RunGameTableContainer } from "../run-game/run-game-table-container";
import { RunGameTabs } from "../run-game/run-game-tabs.twbs";
import { Start } from "../start/start";

import "../scss/for-real-cards.scss";
import {ModalService} from "../../common-app/ui-ng2/modal/modal.service";
import {ConnectEvent} from "../../common-app/api/models/connect-event.class";
import {TopFrame} from "./top-frame.base";
import {TopFrameHeader} from "./top-frame-header";
@Component(
  {
    selector: 'for-real-cards-top-frame',
    directives: [PopoverMenu, ROUTER_DIRECTIVES, ModalDialog, TopFrameHeader],
    viewProviders: [DragulaService],
    providers: [ModalService],
    template: `
<div>
  <top-frame-header></top-frame-header>
  <popover-menu class="pull-right col-xs-1" [menuId]="'topbar'"></popover-menu>
</div>
<router-outlet></router-outlet>
<modal-dialog></modal-dialog>
      `,
  }
)
@Routes([
  {path: '/start', component: Start},
  {path: '/enter-game', component: EnterGame},
  {path: '/game-hand/:id', component: RunGameTabs},
  {path: '/game-table/:id', component: RunGameTableContainer},
  {path: '/edit-profile', component: EditUserProfileTWBS},
  {path: '/frc-deal-modal', component: DealModal},
  {path: '/accounts-admin',  component: AccountsAdmin},
  {path: '/game-action-list',  component: GameActionList}
])
export class ForRealCardsTopFrame extends TopFrame {
  constructor(private router: Router, private ngZone:NgZone) {
    super();
    Menus.addMenu({id: 'topbar'});

    Menus.addSubMenuItem('topbar', {
      id: 'admin.users',
      title: 'User Admin',
      roles: ['admin'],
      callback: ()=>{
        this.router.navigate(['/accounts-admin']);
      }
    });

    Menus.addSubMenuItem('topbar', {
      id: 'admin.game-debug',
      title: 'Game Action List',
      roles: ['admin'],
      callback: ()=>{
        this.router.navigate(['/game-action-list']);
      }
    });

    Menus.addSubMenuItem('topbar', {
      id: 'launch-pad',
      title: 'Start or Join Game',
      callback: ()=>{
        this.navigateToEnter();
      }
    });


    Menus.addSubMenuItem('topbar', {
      id: 'edit-user-profile',
      title: 'Profile',
      callback: ()=>{
        this.navigateToProfile();
      }
    });


    Menus.addSubMenuItem('topbar', {
      id: 'logout',
      title: 'Logout',
      roles: ['*'],
      callback: (menuItem:MenuItem)=> {
        UserEvent.pushEvent(new UserEvent(UserEventType.LOG_OUT_REQUEST));
      }
    });
  }

  ngOnInit() {
    console.log("On Init of top frame");
    Meteor.setTimeout(()=>{
      console.log("ngOnInitTimer")
      if (Meteor.userId()===null || ConnectEvent.isConnected()===false) {
        // If we're not logged in automatically after 500ms, go to login screen 
        // TODO: use a subscription instead
        console.log('navigating to start screen')
        console.log(Meteor.userId())
        console.log(Meteor.status().connected)
        this.navigateToStart()
      } else {
        console.log("this.router.routeTree")
        console.log(Meteor.userId())
        console.log(Meteor.status().connected)
        console.log(this.router.routeTree);
        if (!this.router.routeTree._root.children || !this.router.routeTree._root.children.length) {
          // Navigate to start if we're nowhere, otherwise we assume user came in via URL directly to game
          console.log(!this.router.routeTree._root.children)
          console.log(!this.router.routeTree._root.children.length)
          this.navigateToEnter();
        }
      }
    }, 500);
    this.watchGame();
    this.watchUserEvents();
  }
  
 
  protected navigateToEnter() {
    this.ngZone.run( ()=>{
      this.router.navigate(['/enter-game']);
    });
  }

  protected navigateToProfile() {
    this.ngZone.run( ()=> {
      this.router.navigate(['/edit-profile']);
    });
  }

  protected navigateToStart() {
    this.ngZone.run( ()=> {
      this.router.navigate(['/start']);
    });
  }

  protected navigateToGameTable(gameId:string=''):void {
    this.ngZone.run( ()=> {
      this.router.navigate(['/game-table/', gameId]); // gameId parameter in URL for refresh feature (not yet implemented)
    });
  }

  protected navigateToGamePlayer(gameId:string=''):void {
    this.ngZone.run( ()=> {
      this.router.navigateByUrl('/game-hand/' + gameId);  // gameId parameter in URL for refresh feature (not yet implemented)
    });
  }
}
  
export function run() {
  bootstrap(ForRealCardsTopFrame,
    [
      provide(APP_BASE_HREF, { useValue: '/' }),
      ROUTER_PROVIDERS,
      ROUTER_DIRECTIVES,
      provide(LocationStrategy,
        {useClass: HashLocationStrategy})
    ]
  );
}

export function prepare():void {
  
}