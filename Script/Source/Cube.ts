namespace Script {
  import ƒ = FudgeCore;
  ƒ.Project.registerScriptNamespace(Script);  // Register the namespace to FUDGE for serialization

  export class Cube extends ƒ.ComponentScript {
    // Register the script as component for use in the editor via drag&drop
    public static readonly iSubclass: number = ƒ.Component.registerSubclass(Cube);
    private start: ƒ.Vector2;
    private mtxCurrent: ƒ.Matrix4x4 = new ƒ.Matrix4x4();
    private cube: ƒ.Node;


    constructor() {
      super();

      // Don't start when running in editor
      if (ƒ.Project.mode == ƒ.MODE.EDITOR)
        return;

      // Listen to this component being added to or removed from a node
      this.addEventListener(ƒ.EVENT.COMPONENT_ADD, this.hndEvent);
      this.addEventListener(ƒ.EVENT.COMPONENT_REMOVE, this.hndEvent);
      this.addEventListener(ƒ.EVENT.NODE_DESERIALIZED, this.hndEvent);
    }

    // Activate the functions of this component as response to events
    public hndEvent = (_event: Event): void => {
      switch (_event.type) {
        case ƒ.EVENT.COMPONENT_ADD:
          this.node.addEventListener("pointerdown", <ƒ.EventListenerUnified>this.hndPointerEvent);
          this.node.addEventListener("pointermove", <ƒ.EventListenerUnified>this.hndPointerEvent);
          this.node.addEventListener("pointerup", <ƒ.EventListenerUnified>this.hndPointerEvent);
          this.node.addEventListener("reset", this.reset, true);
          break;
        case ƒ.EVENT.COMPONENT_REMOVE:
          this.removeEventListener(ƒ.EVENT.COMPONENT_ADD, this.hndEvent);
          this.removeEventListener(ƒ.EVENT.COMPONENT_REMOVE, this.hndEvent);
          break;
        case ƒ.EVENT.NODE_DESERIALIZED:
          this.cube = this.node.getParent();
          this.mtxCurrent.copy(this.cube.mtxLocal.clone);
          break;
      }
    }

    public hndPointerEvent = (_event: PointerEvent): void => {
      console.log(_event.type);

      switch (_event.type) {
        case "pointerdown":
          this.start = new ƒ.Vector2(_event.offsetX, _event.offsetY);
          this.mtxCurrent.copy(this.cube.mtxLocal.clone);
          break;
        case "pointermove":
          if (!this.start)
            return;
          let move: ƒ.Vector2 = ƒ.Recycler.reuse(ƒ.Vector2);
          move.set(_event.offsetX - this.start.x, this.start.y - _event.offsetY);
          let mag: number = move.magnitude;
          if (mag > 10)
            move.normalize(10);
          this.cube.mtxLocal.copy(this.mtxCurrent);
          this.cube.mtxLocal.rotateX(move.y, true);
          this.cube.mtxLocal.rotateY(move.x);
          break;
        case "pointerup":
          this.reset();
          break;
      }
    }

    public reset = (_event?: CustomEvent): void => {
      this.cube.mtxLocal.copy(this.mtxCurrent);
      this.start = null;
    }

    // protected reduceMutator(_mutator: ƒ.Mutator): void {
    //   // delete properties that should not be mutated
    //   // undefined properties and private fields (#) will not be included by default
    // }
  }
}