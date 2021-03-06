import { Meteor } from 'meteor/meteor';
import { NgZone } from '@angular/core';
import { select } from '@angular-redux/store';


import { DragulaService } from 'ng2-dragula/ng2-dragula';

import { Card, CardCountAllowed, CardLocation, Deck, DeckLocation, GameConfig, Hand } from '../api';
import { DragAndDrop, ForRealCardsActions, GameRenderingTools, INITIAL_STATE_GAME_PLAY, INITIAL_STATE_FOR_REAL_CARDS } from '../ui';

import { CardImageStyle} from "../api/interfaces/card-image-style.interface";
import { GamePlayActions, IForRealCardsState, IGamePlayRecord} from "../ui";
import {DealModalService} from "../deal-modal/deal-modal.service";
import {CommonPopups} from "../../common-app/src/ui-ng2/common-popups/common-popups";
import {DealLocation, DealSequence} from '../api/models/game-config';
import {GamePlayFunctions} from '../ui/redux/game-play/game-play.functions';

declare const window: any;

export abstract class RunGame {
  @select() gamePlayReducer$;
  @select() forRealCardsReducer$;
  protected abstract dragulaService: DragulaService;
  protected abstract ngZone:NgZone;
  protected abstract dealModelService:DealModalService;
  protected abstract commonPopups:CommonPopups;

  abstract childInit();
  gameState:IGamePlayRecord;
  forRealCardsState:IForRealCardsState;
  protected static dragAndDropInitialized:boolean = false;

  constructor() {
  }

  ngOnInit() {
    this.gamePlayReducer$.subscribe( (gameState:IGamePlayRecord)=>{
      this.ngZone.run(()=>{
        if (gameState)
          this.gameState = gameState;
        else
          this.gameState = INITIAL_STATE_GAME_PLAY;
      });
    } );
    this.forRealCardsReducer$.subscribe( (forRealCardsState:IForRealCardsState)=>{
      this.ngZone.run(()=>{
        forRealCardsState = forRealCardsState || INITIAL_STATE_FOR_REAL_CARDS;
        this.forRealCardsState = forRealCardsState;
        if (forRealCardsState.gameId===null && !forRealCardsState.loading) { // Check to make sure loading request not already issued
          // We must have deep linked here or refreshed, so let's load the game
          let pathname:string[] = window.location.pathname.split('/');
          if (pathname.length>=3) {
            let subUrl:string = pathname[1];
            let gameId:string = pathname[2];
            ForRealCardsActions.loadGameRequest(gameId, '');
          }
        }
      });
      this.childInit();
    } );
    this.dragAndDropInit();
  }

  private dragAndDropInit() { // Share a scope for drag and drop

    if (!RunGame.dragAndDropInitialized) {
      RunGame.dragAndDropInitialized = true;

      let moves = (el, source, handle, sibling)=> {
        return true; // elements are always draggable by default
      };
      let accepts = (el, target, source, sibling)=> {
        let dragAndDrop = new DragAndDrop(el, target, source, sibling, this.gameState);
        return dragAndDrop.isDropAllowed();
      };
      let invalid = (el, hanlde)=> {
/*        console.log('invalid')
        console.log(el);
        if (el.nodeName.toLowerCase()==="img") {  // Only drag container, not image so styling remains intact
          return true;
        }
        */
        return false;
      };

      let options = {
        copy: true,
        copySortSource: true,
        moves: moves,
        accepts: accepts,
        invalid: invalid
      };
//      console.log('setOPtions')
//      console.log(options)
      this.dragulaService.setOptions('drag-and-drop',
        options
      );
      this.dragulaService.drag.subscribe((value)=>{
        let [arg1, e, el] = value;
      });
      this.dragulaService.drop.subscribe((value)=>{
        let [arg1, el, targetEl, sourceEl, siblingEl] =value;
        let dragAndDrop = new DragAndDrop(el, targetEl, sourceEl, siblingEl, this.gameState);
        if (!dragAndDrop.isDropAllowed()) {
          dragAndDrop.logError("Drop received an element that should not have been allowed");
          return;
        }
//        console.log('drop')
//        console.log(dragAndDrop)

        dragAndDrop.runActions();
        
      });
    }
  }
  
  getHands():Hand[] {
    if (this.gameState)
      return this.gameState.hands.toArray();
  }

  getDecks() {
    return Deck.getDecks();
  }

  getCardsInHand(userId:string = Meteor.userId()):Card[] {
    let hand:Hand = this.getHand(userId);
    if (hand)
      return hand.cardsInHand;
  }

  getHand(userId:string = Meteor.userId()):Hand {
    if (this.gameState) {
      let hand:Hand = GamePlayActions.getHandFromUserId(this.gameState.hands, userId);
      return hand;
    }
  }

  getCardsInHandFaceUp(userId:string = Meteor.userId()):Card[] {
    if (this.gameState) {
      let hand:Hand = GamePlayActions.getHandFromUserId(this.gameState.hands, userId);
      if (hand)
        return hand.cardsFaceUp;
    }
  }

  getCardsInDeck():Card[] {
    if (this.gameState)
      return this.gameState.tableFaceDown.toArray();
  }

  getCardsInPile():Card[] {
    if (this.gameState)
      return this.gameState.tablePile.toArray();
  }

  getCardsFaceUp(userId:string = Meteor.userId()):Card[] {
    if (this.gameState) {
      let hand:Hand = GamePlayActions.getHandFromUserId(this.gameState.hands, userId);
      if (hand)
        return hand.cardsFaceUp;
    }
  }

  topCardInPile():Card {
    if (this.gameState && this.gameState.tablePile) {
      let length = this.gameState.tablePile.size;
      if (length)
        return this.gameState.tablePile.get(length - 1);
    }
  }

  shouldShowTableDrop():boolean {
    return (
      this.gameState &&
      this.gameState.currentGameConfig &&
      this.gameState.currentGameConfig.isTarget(CardLocation.TABLE)
    )
  }

  private tricksInProgress():boolean {
    let gameConfig:GameConfig = this.gameState.currentGameConfig;
    if (gameConfig) {
      if (gameConfig.hasTricks) {
        let hands:Hand[] =  this.gameState.hands.toArray();
        for (let i=0; i<hands.length; i++) {
          let hand:Hand = hands[i];
          if (hand.cardsFaceUp.length>0 || hand.tricks.length>0) {
            return true;
          }
        }
      }
    }
    return false;
  }

  shouldShowPile():boolean {
    return (
      this.gameState &&
      this.gameState.currentGameConfig &&
      (
        this.gameState.currentGameConfig.alwaysShowTurnedUpCard
        ||
        (
          this.tricksInProgress()===false &&
          (
            this.gameState.currentGameConfig.isTarget(CardLocation.PILE) ||
            this.gameState.currentGameConfig.isSource(CardLocation.PILE)
          )
        )
      )
    );
  }

  shouldShowPileAll() : boolean {
    let gameState: IGamePlayRecord = this.gameState;
    let gameConfig: GameConfig = gameState ? gameState.currentGameConfig : null;
    if (!gameConfig)
      return false;
    return !!gameConfig.dealSequence.find( (dealStep:DealSequence) => {
      return dealStep.dealLocation === DealLocation.CENTER_FACEUP_SHOWALL;
    } );
  }

  shouldShowDeck():boolean {
    if (this.gameState && this.gameState.currentGameConfig)
      return this.tricksInProgress()===false && this.gameState.currentGameConfig.deckLocationAfterDeal == DeckLocation.CENTER;
  }

  cardBackURL(portrait:boolean = true):string {
    return GameRenderingTools.getCardBackURL(this.gameState.gameId, portrait);
  }

  canShowHand():boolean {
    return (
      this.gameState &&
      this.gameState.currentGameConfig && 
      this.gameState.currentGameConfig.findCommand(CardLocation.HAND, CardLocation.TABLE).cardCountAllowed===CardCountAllowed.ALL
    );
  }

  showHand():void {
    GamePlayActions.showHand(this.gameState);
  }


  cardCountStyle(landscape:boolean) {
    return landscape ?  {position: 'absolute', top:'5%', left:'65%'} : {position: 'absolute', top:0, left:'85%'};
  }

  cardImgStyle(landscape:boolean):CardImageStyle {
    return landscape ? this.landscapeCardStyle() : this.portraitCardStyle();
  }

  private landscapeCardStyle():CardImageStyle {
    // https://waapi.github.io/tool-transforms/
    return {
      transform: 'rotate(90deg) translateY(50%) translateY(-50%)',
      //height: '100%',
      //width: '100%' // !important needed?
    }
  }

  private portraitCardStyle():CardImageStyle {
    return {
      height: '100%',
      width: '100%'
    }
  }

  getBetForHand(hand: Hand): number {
    return GamePlayFunctions.moneyPlayerBetting(this.gameState, hand.userId);
  }

  getBetForTable(): number {
    return GamePlayFunctions.moneyOnTable(this.gameState, true);
  }
}

