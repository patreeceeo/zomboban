import { NetworkedEntityClient } from "../NetworkedEntityClient";
import { SignInForm, SignInFormOptions } from "../SignInForm";
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

// let updateCount = 0;

declare const signInForm: HTMLFormElement;

export class ClientSystem extends SystemWithQueries<Context> {
  changed = this.createQuery([ChangedTag, IsGameEntityTag]);
  entitiesToSave = new Set<any>();
  async #save(client: NetworkedEntityClient) {
    console.log(`Saving ${this.entitiesToSave.size} changed entities`);
    for (const entity of this.entitiesToSave) {
      if (AddedTag.has(entity)) {
        await client.saveEntity(entity);
      } else if (ServerIdComponent.has(entity)) {
        await client.deleteEntity(entity);
      }
      ChangedTag.remove(entity);
    }
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
        this.#form.hide();
        context.isSignedIn = true;
        if (context.lastSaveRequestTime > 0) {
          this.#save(context.client);
        }
      } else {
        console.info("Sign in failed", response.status, response.statusText);
      }
    };

    const formOptions = new SignInFormOptions(callback);
    this.#form = new SignInForm(signInForm, formOptions);
  }
  start(context: Context) {
    super.start(context);
    this.resources.push(
      this.changed.onAdd((entity) => {
        this.entitiesToSave.add(entity);
      })
    );
  }
  update(context: Context) {
    // console.log("update", updateCount++);
    if (context.inputPressed === KEY_MAPS.SAVE) {
      // console.log("pressed save");
      let lastSaveRequestTime = context.lastSaveRequestTime;
      context.lastSaveRequestTime = context.time;
      if (!context.isSignedIn) {
        this.#form.show();
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
