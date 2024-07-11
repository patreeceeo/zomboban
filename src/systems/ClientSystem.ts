import { NetworkedEntityClient } from "../NetworkedEntityClient";
import { Not } from "../Query";
import { SignInForm, SignInFormOptions } from "../ui/SignInForm";
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

type Context = QueryState &
  EntityManagerState &
  InputState &
  TimeState &
  ClientState;

declare const signInElement: HTMLDialogElement;

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
  async #save(client: NetworkedEntityClient) {
    const { addedSet, changedSet, removedSet } = this;
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
  }
  #form: SignInForm;
  constructor(mgr: SystemManager<Context>) {
    super(mgr);

    const { context } = mgr;
    const callback = async (response: Response) => {
      if (response.ok) {
        console.info(
          "Sign in successful",
          response.status,
          response.statusText
        );
        this.#form.close();
        context.isSignedIn = true;
        if (context.lastSaveRequestTime > 0) {
          this.#save(context.client);
        }
      } else {
        console.info("Sign in failed", response.status, response.statusText);
      }
    };

    const formOptions = new SignInFormOptions(callback);
    this.#form = new SignInForm(signInElement, formOptions);
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
    // TODO use state.keyMapping
    // console.log("update", updateCount++);
    if (context.inputPressed === KEY_MAPS.SAVE) {
      // console.log("pressed save");
      let lastSaveRequestTime = context.lastSaveRequestTime;
      context.lastSaveRequestTime = context.time;
      if (!context.isSignedIn) {
        this.#form.open();
      } else {
        if (context.time - lastSaveRequestTime > 200) {
          // console.log("enough time has passed");
          this.#save(context.client);
          // if (this.changed.size > 0) {
          // console.log("updating last save time");
          // }
        }
      }
    }
  }
}
