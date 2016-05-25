import {Deck} from '../api/models/deck.model.ts';
import {Hand, HandCollection} from  '../api/models/hand.model.ts';
import {Meteor} from 'meteor/meteor';
import {Tracker, Computation} from 'meteor/tracker';
import {Mongo, Cursor} from 'meteor/mongo'
import {Session} from 'meteor/session';
import {GameStreams} from '../api/services/game-streams';
import {Card} from '../api/models/card.model.ts'
import {Action} from '../api/models/action.model.ts'
import {CommonPopups} from "../../common/ui-twbs_ng15/common-popups";
import * as log from 'loglevel';
import {GameRenderingTools} from "../api/services/game-rendering-tools";
import {Card, CardSuit, CardRank} from "../api/models/card.model";
import {Action, VisibilityType, ActionType} from "../api/models/action.model"
import {DeckLocation, GameConfig, CardLocation, CardCountAllowed} from "../api/models/game-config";
import {FastCardsTopFrame} from './top-frame.ts';
import {DragAndDrop} from "../api/services/drag-and-drop";

let dragula = require("dragula");


const SESSION_GAME_ID_KEY = 'session-game-id';
export class RunGame {
  protected $log:any;
  protected $scope:any;
  topFrame:FastCardsTopFrame;
  gameId:string;
  userPassword:string;
  protected static gameStreams:GameStreams;
  private static gameStreamInitializedToId:string;
  protected static dragAndDropInitialized:boolean = false;
  protected static drake;
  private dragSource:string;

  $onInit() {
//    console.log('init rungame');
//    console.log(this);
    this.dragAndDropInit();
  }

  $onChanges(obj) {
//    console.log('onchanges rungame:');
//    console.log(obj);
//    console.log(this)
    this.initialize();
  }

  constructor($log, $scope) {
    this.$log = $log;
    this.$scope = $scope;

  };

  static getActions():Action[] {
    return RunGame.gameStreams.actions;
  }

  dragAndDropInit() { // Share a scope for drag and drop
    let containerElements = _.toArray(document.getElementsByClassName('drag-and-drop-container'));

    if (!RunGame.dragAndDropInitialized) {
      RunGame.dragAndDropInitialized = true;

      let moves = (el, source, handle, sibling)=> {
        return true; // elements are always draggable by default
      };
      let accepts = (el, target, source, sibling)=> {
        let dragAndDrop = new DragAndDrop(el, target, source, sibling, RunGame.gameStreams.currentGameConfig);
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
      RunGame.drake = dragula(
        containerElements,
        options
      );

      RunGame.drake.on('drag', (el, source)=> {
      });
      RunGame.drake.on('drop', (el, targetEl, sourceEl, siblingEl)=> {
        let dragAndDrop = new DragAndDrop(el, targetEl, sourceEl, siblingEl, RunGame.gameStreams.currentGameConfig);
        if (!dragAndDrop.isDropAllowed()) {
          dragAndDrop.logError("Drop received an element that should not have been allowed");
          return;
        }
        console.log('drop')
        console.log(dragAndDrop)

        dragAndDrop.runActions(RunGame.gameStreams);        
        
      });
    } else {
      RunGame.drake.containers = containerElements;
    }
  }

  getHands():Hand[] {
    return RunGame.gameStreams.hands;
  }

  private initialize() {

    if (RunGame.gameStreamInitializedToId !== this.gameId) {
      this.userPassword = Session.get('password');
      if (!this.amIIncluded()) {
        Meteor.call('FastCardsJoinGame', this.gameId, this.userPassword, (error, result:Hand)=> {
          if (error) {
            this.$log.error(error);
          } else {
            this.setIncluded(result.gameId);
          }
        })
      }

      console.log('subscribing to game' + this.gameId);

      RunGame.gameStreams = new GameStreams(this.gameId);
      RunGame.gameStreamInitializedToId = this.gameId;
      RunGame.gameStreams.subscribe(
        (action:Action)=> {
          /*           log.debug('Got subscription callback in run-game.ts. Action:');
           log.debug(action);
           log.debug(RunGame.gameStreams.hands)
           log.debug(this)*/
          if (action.actionType === ActionType.RESET) {
            if (this.topFrame)
              this.topFrame.setGameDescription("New Game (id " + this.gameId + ")");
          } else if (action.actionType === ActionType.DEAL) {
            if (this.topFrame)
              this.topFrame.setGameDescription(RunGame.gameStreams.currentGameConfig.name + " (id " + this.gameId + ")");
          }
          if (action.sequencePosition===action.sequenceLength-1) {
            // Only process if this the last one
            Meteor.setTimeout(()=> {
              this.$scope.$apply();
            }, 0);
          }
        },
        (error)=> {
          log.error(error);
          CommonPopups.alert(error);
        }
      );
    }
  }

  private amIIncluded():boolean {
    let sessionGameId = Session.get(SESSION_GAME_ID_KEY);
    return (sessionGameId === this.gameId);
  }

  private setIncluded(gameId:string) {
    Session.set(SESSION_GAME_ID_KEY, gameId)
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
    if (RunGame.gameStreams) {
      let hand:Hand = RunGame.gameStreams.getHandFromUserId(userId);
      return hand;
    }
  }

  getCardsInHandFaceUp(userId:string = Meteor.userId()):Card[] {
    if (RunGame.gameStreams) {
      let hand:Hand = RunGame.gameStreams.getHandFromUserId(userId);
      if (hand)
        return hand.cardsFaceUp;
    }
  }

  getCardsInDeck():Card[] {
    return RunGame.gameStreams.tableFaceDown;
  }

  getCardsInPile():Card[] {
    return RunGame.gameStreams.tablePile;
  }

  getCardsFaceUp(userId:string = Meteor.userId()):Card[] {
    let hand:Hand = RunGame.gameStreams.getHandFromUserId(userId);
    if (hand)
      return hand.cardsFaceUp;
  }

  topCardInPile():Card {
    let length = RunGame.gameStreams.tablePile.length;
    if (length)
      return RunGame.gameStreams.tablePile[length - 1];
  }

  shouldShowTableDrop():boolean {
    return RunGame.gameStreams.currentGameConfig &&
      RunGame.gameStreams.currentGameConfig.isTarget(CardLocation.TABLE)
  }

  private tricksInProgress():boolean {
    let gameConfig:GameConfig = RunGame.gameStreams.currentGameConfig;
    if (gameConfig) {
      if (gameConfig.hasTricks) {
        let hands:Hand[] =  RunGame.gameStreams.hands;
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
      RunGame.gameStreams.currentGameConfig &&
      (
        this.tricksInProgress()===false &&
        (
          RunGame.gameStreams.currentGameConfig.isTarget(CardLocation.PILE) ||
          RunGame.gameStreams.currentGameConfig.isSource(CardLocation.PILE)
        )
      )
    );
  }


  shouldShowDeck():boolean {
    if (RunGame.gameStreams.currentGameConfig)
      return this.tricksInProgress()===false && RunGame.gameStreams.currentGameConfig.deckLocationAfterDeal == DeckLocation.CENTER;
  }

  cardBackURL(portrait:boolean = true):string {
    return GameRenderingTools.getCardBackURL(this.gameId, portrait);
  }

  canShowHand():boolean {
    return (
      RunGame.gameStreams.currentGameConfig && 
      RunGame.gameStreams.currentGameConfig.findCommand(CardLocation.HAND, CardLocation.TABLE).cardCountAllowed===CardCountAllowed.ALL
    );
  }

  showHand():void {
    RunGame.gameStreams.showHand();
  }

}
