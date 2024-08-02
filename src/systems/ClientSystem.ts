import { IslandElement } from "Zui/Island";
import { Not } from "../Query";
import { SystemManager, SystemWithQueries } from "../System";
import {
  InSceneTag,
  ChangedTag,
  IsGameEntityTag,
  ServerIdComponent,
  CanDeleteTag
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
    InSceneTag,
    Not(ServerIdComponent)
  ]);
  changed = this.createQuery([
    ChangedTag,
    IsGameEntityTag,
    InSceneTag,
    ServerIdComponent,
    Not(CanDeleteTag)
  ]);
  removed = this.createQuery([
    IsGameEntityTag,
    ServerIdComponent,
    CanDeleteTag
  ]);
  addedSet = new Set<any>();
  changedSet = new Set<any>();
  removedSet = new Set<any>();
  async #save(context: Context) {
    const { client } = context;
    const { addedSet, changedSet, removedSet } = this;
    context.triggerRequestStart("Saving");
    const count = addedSet.size + changedSet.size + removedSet.size;
    if (count > 0) {
      context.savedMessageCountdown = 2000;
      context.$savedChangeCount = count;
    }
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
  #signInForm: IslandElement;
  constructor(mgr: SystemManager<Context>) {
    super(mgr);

    const { context } = mgr;
    const form = (this.#signInForm = document.querySelector(
      "my-sign-in-form"
    ) as IslandElement);
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
    context.savedMessageCountdown = Math.max(
      0,
      context.savedMessageCountdown - context.dt
    );
    if (context.inputPressed === KEY_MAPS.SAVE) {
      let lastSaveRequestTime = context.lastSaveRequestTime;
      context.lastSaveRequestTime = context.time;
      if (!context.isSignedIn) {
        const controller = this.#signInForm.controller as SignInFormController;
        controller.open();
      } else {
        if (context.time - lastSaveRequestTime > 200) {
          this.#save(context);
        }
      }
    }
  }
}
