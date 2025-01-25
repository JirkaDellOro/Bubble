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

    private hndPointerEvent = (_event: PointerEvent): void => {
      console.log(_event.type);

      switch (_event.type) {
        case "pointerdown":
          this.start = new ƒ.Vector2(_event.offsetX, _event.offsetY);
          this.mtxCurrent.copy(this.cube.mtxLocal.clone);
          break;
        case "pointermove":
          if (!this.start)
            return;
          const move: ƒ.Vector2 = this.calcMove(_event);
          this.cube.mtxLocal.copy(this.mtxCurrent);
          this.rotate(this.cube, move);
          ƒ.Recycler.store(move);
          break;
        case "pointerup":
          this.reset(_event);
          break;
      }
    }


    private reset = (_event?: CustomEvent | PointerEvent): void => {
      if (!this.start)
        return;

      const move: ƒ.Vector2 = this.calcMove(_event instanceof PointerEvent ? _event : _event.detail);
      this.start = null;
      ƒ.DebugTextArea.textArea.style.backgroundColor = "green";

      if (move.magnitude > 9.9) {
        ƒ.DebugTextArea.textArea.style.backgroundColor = "red";
        if (Math.abs(move.x) > Math.abs(move.y))
          move.set(move.x = move.x < 0 ? -2 : 2, 0);
        else
          move.set(0, move.y = move.y < 0 ? -2 : 2);

        ƒ.Time.game.setTimer(10, 45, (_event: ƒ.EventTimer) => {
          this.rotate(this.node, move)
          if (_event.lastCall)
            this.cube.mtxLocal.copy(this.mtxCurrent);
        });
        return;
      }

      this.cube.mtxLocal.copy(this.mtxCurrent);
    }

    private rotate(_node: ƒ.Node, _move: ƒ.Vector2): void {
      _node.mtxLocal.rotateX(_move.y, true);
      _node.mtxLocal.rotateY(_move.x, true);
    }

    private calcMove = (_event: PointerEvent): ƒ.Vector2 => {
      let move: ƒ.Vector2 = ƒ.Recycler.get(ƒ.Vector2);
      move.set(_event.offsetX - this.start.x, this.start.y - _event.offsetY);
      let mag: number = move.magnitude;
      if (mag > 10)
        move.normalize(10);
      return move;
    }

    // protected reduceMutator(_mutator: ƒ.Mutator): void {
    //   // delete properties that should not be mutated
    //   // undefined properties and private fields (#) will not be included by default
    // }
  }
}