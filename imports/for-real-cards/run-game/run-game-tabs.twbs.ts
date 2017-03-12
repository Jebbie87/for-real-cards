import { Component, NgZone, OnInit } from '@angular/core';
import { select } from '@angular-redux/store';

import { RunGameContainer } from "./run-game-container";

@Component(
  {
    selector: 'run-game-tabs',
    template:  `
 
  <tabset active="active">
    <tab index="0" heading="Hand and Table">
      <run-game-hand-and-table></run-game-hand-and-table>
    </tab>
    <tab index="1" heading="Hand">
      <run-game-hand showTableProxy="true"></run-game-hand>    
    </tab> 
    <tab index="2" heading="Table">
     <run-game-table height="90vw" width="100hw"></run-game-table>  
    </tab>
  </tabset>
      `
  }
)

export class RunGameTabs extends RunGameContainer implements OnInit {
  @select() gamePlayReducer;
  constructor(private ngZone:NgZone) {
    super(ngZone);
  }

  ngOnInit() {
    this.initialize(this.gamePlayReducer);
  }

}

