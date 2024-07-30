import { IslandElement } from "Zui/Island";
import { Not } from "../Query";
import { SystemManager, SystemWithQueries } from "../System";
import {
  AddedTag,
  ChangedTag,
  IsGameEntityTag,
  ServerIdComponent
} from "../components";
import { KEY_MAPS } from "../constants";
import {
  ClientState,
  EntityManagerState,
  InputState,
  QueryState,
  TimeState
} from "../state";
import { signInEvent } from "../ui/events";
import { SignInFormController } from "../ui/my-sign-in-form";

type Context = QueryState &
  EntityManagerState &
  InputState &
  TimeState &
  ClientState;

export class ClientSystem extends SystemWithQueries<Context> {
  added = this.createQuery([
    ChangedTag,
    IsGameEntityTag,
    AddedTag,
    Not(ServerIdComponent)
  ]);
  changed = this.createQuery([
    ChangedTag,
    IsGameEntityTag,
    AddedTag,
    ServerIdComponent
  ]);
  removed = this.createQuery([
    ChangedTag,
    IsGameEntityTag,
    ServerIdComponent,
    Not(AddedTag)
  ]);
  addedSet = new Set<any>();
  changedSet = new Set<any>();
  removedSet = new Set<any>();
  async #save(context: Context) {
    const { client } = context;
    const { addedSet, changedSet, removedSet } = this;
    context.triggerRequestStart("Saving");
    this.log(`POSTing ${addedSet.size} new entities`);
    for (const entity of addedSet) {
      await client.postEntity(entity);
    }
    addedSet.clear();
    this.log(`PUTting ${changedSet.size} changed entities`);
    for (const entity of changedSet) {
      await client.putEntity(entity);
    }
    changedSet.clear();
    this.log(`DELETting ${removedSet.size} removed entities`);
    for (const entity of removedSet) {
      await client.deleteEntity(entity);
    }
    removedSet.clear();
    context.triggerRequestEnd();
  }
  #signInForm: SignInFormController;
  constructor(mgr: SystemManager<Context>) {
    super(mgr);

    const { context } = mgr;
    const form = document.querySelector("my-sign-in-form") as IslandElement;
    this.#signInForm = form.controller as SignInFormController;
    signInEvent.receiveOn(form, () => {
      context.isSignedIn = true;
      if (context.lastSaveRequestTime > 0) {
        this.#save(context);
      }
    });
  }
  start(context: Context) {
    super.start(context);
    this.resources.push(
      this.added.onAdd((entity) => {
        this.addedSet.add(entity);
      }),
      this.changed.onAdd((entity) => {
        this.changedSet.add(entity);
      }),
      this.removed.onAdd((entity) => {
        this.removedSet.add(entity);
      })
    );
  }
  update(context: Context) {
    if (context.inputPressed === KEY_MAPS.SAVE) {
      let lastSaveRequestTime = context.lastSaveRequestTime;
      context.lastSaveRequestTime = context.time;
      if (!context.isSignedIn) {
        this.#signInForm.open();
      } else {
        if (context.time - lastSaveRequestTime > 200) {
          this.#save(context);
        }
      }
    }
  }
}
