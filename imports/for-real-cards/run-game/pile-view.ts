/**
 * Copyright Ken Ono, Fabrica Technolology 2016
 * Source code license under Creative Commons - Attribution-NonCommercial 2.0 Canada (CC BY-NC 2.0 CA)
 */

import { Component, Input, NgZone } from '@angular/core';
import { DragulaService } from 'ng2-dragula/ng2-dragula';

import { RunGame } from './run-game.ts';
import { CardImageStyle } from "../api/index";
import {CommonPopups} from "../../common-app/src/ui-ng2/common-popups/common-popups";
import {DealModalService} from "../deal-modal/deal-modal.service";

@Component(
  {
    selector: 'pile-view',
    template: `

<playing-card 
  [hidden]="!numberOfCards()"
  [card]="topCardInPile()" 
  [imgStyle]="imgStyle"
  [attr.data-card-rank]="topCardInPile()?.rank"
  [attr.data-card-suit]="topCardInPile()?.suit"
>
</playing-card>      
<label 
  *ngIf="numberOfCards()" 
  class="card-count" 
  style="position: absolute; 10%; top:0%; left:85%; ">
  {{numberOfCards()}}
</label>
<div *ngIf="numberOfCards()===0"  
  style="position: absolute; height:100%; width:100%; border-width: 1px; border-style: solid;border-color: black ">
</div> 

`
  }
)
export class PileView extends RunGame {
  @Input() imgStyle:CardImageStyle;
  constructor(
    protected dragulaService: DragulaService,
    protected ngZone:NgZone,
    protected dealModelService:DealModalService,
    protected commonPopups:CommonPopups,
  ) {
    super();
  }
  childInit() {}

  numberOfCards():number {
    return this.getCardsInPile() ? this.getCardsInPile().length : 0;
  }
}