
import { Meteor } from 'meteor/meteor';
import { Observable } from 'rxjs';

import { User } from "../../../../../common-app-api/";
import { MeteorCursorObservers } from "../../reactive-data/meteor-cursor-observers";
import { IDocumentChange } from "../../reactive-data/document-change.interface";

export class UsersService {
  private static userCursor:Mongo.Cursor<User>;

  static createUsersObserver():Observable<IDocumentChange<User>>
  {
    return MeteorCursorObservers.createCursorObserver<User>(Meteor.users.find()); // Depends on subscription being called elsewhere
  }
}
