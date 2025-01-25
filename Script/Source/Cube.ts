namespace Script {
  import ƒ = FudgeCore;
  ƒ.Project.registerScriptNamespace(Script);  // Register the namespace to FUDGE for serialization

  export type Content = string | URL;

  export class Cube extends ƒ.ComponentScript {
    // Register the script as component for use in the editor via drag&drop
    public static readonly iSubclass: number = ƒ.Component.registerSubclass(Cube);
    private start: ƒ.Vector2;
    private mtxCurrent: ƒ.Matrix4x4 = new ƒ.Matrix4x4();
    private cube: ƒ.Node;
    private textures: ƒ.Texture[] = [];
    private static indentity: ƒ.Matrix4x4 = ƒ.Matrix4x4.IDENTITY();

    private static rotate: { [key: string]: number[] } = {
      left: [1, 2, 3, 0, 4, 5],
      right: [3, 0, 1, 2, 4, 5],
      up: [4, 1, 5, 3, 2, 0],
      down: [5, 1, 4, 3, 0, 2]
    }


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

    public async setTextures(_content: Content[]): Promise<void> {
      for (let i: number = 0; i < 6; i++) {
        const side: ƒ.Node = this.node.getChild(i);
        const texture: ƒ.TextureCanvas = await this.createTexture(_content[i].toString());
        const material: ƒ.Material = new ƒ.Material(i.toString(), ƒ.ShaderFlatTextured);
        (<ƒ.CoatTextured>material.coat).texture = texture;
        side.removeComponent(side.getComponent(ƒ.ComponentMaterial));
        side.addComponent(new ƒ.ComponentMaterial(material));

        this.textures.push(texture)
        // this.resetTextures();
      }
    }

    private resetTextures(): void {
      for (let i: number = 0; i < 6; i++) {
        const side: ƒ.Node = this.node.getChild(i);
        (<ƒ.CoatTextured>side.getComponent(ƒ.ComponentMaterial).material.coat).texture = this.textures[i];
      }
    }

    private async createTexture(_text: string): Promise<ƒ.TextureCanvas> {
      const size: number = 100;
      const canvas: OffscreenCanvas = new OffscreenCanvas(size, size);
      const crc2: OffscreenCanvasRenderingContext2D = canvas.getContext("2d");
      const txr: ƒ.TextureCanvas = new ƒ.TextureCanvas("canvas", crc2);
      crc2.fillStyle = "yellow";
      crc2.fillRect(0, 0, canvas.width, canvas.height);
      crc2.fillStyle = "black";
      crc2.strokeStyle = "black";
      crc2.font = "50px serif";
      crc2.fillText(_text, 0, 80, 100);
      crc2.fill();

      let text: HTMLSpanElement = document.createElement("span");
      text.innerHTML = "eins zwei drei vier fünf sechs sieben acht";
      drawHtmlDom(text, 0, 0, canvas.width, canvas.height)

      async function drawHtmlDom(_html: HTMLElement, _x: number, _y: number, _width: number, _height: number): Promise<void> {
        var d: string = "data:image/svg+xml,";
        d += "<svg xmlns='http://www.w3.org/2000/svg' width='" + _width + "' height='" + _height + "' >";
        d += "<foreignObject width='100%' height ='100%'>";
        d += "<div xmlns='http://www.w3.org/1999/xhtml'>";
        d += _html.outerHTML;
        d += "</div></foreignObject></svg>";
        var i: HTMLImageElement = new Image();
        i.src = d;
        crc2.drawImage(i, _x, _y);
        // i.onload = await async function (): Promise<void> {
        // };
      }

      return txr;
    }

    // Activate the functions of this component as response to events
    private hndEvent = (_event: Event): void => {
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
          // this.node.addEventListener(ƒ.EVENT.CHILD_APPEND, (_event: Event) => {
          this.cube = this.node.getParent();
          this.mtxCurrent.copy(this.cube.mtxLocal.clone);
          // });
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
        const step: number = 6;
        if (Math.abs(move.x) > Math.abs(move.y))
          move.set(move.x = move.x < 0 ? -step : step, 0);
        else
          move.set(0, move.y = move.y < 0 ? -step : step);

        ƒ.Time.game.setTimer(30, 90 / step, (_event: ƒ.EventTimer) => {
          this.rotate(this.node, move)
          if (_event.lastCall) {
            this.cube.mtxLocal.copy(this.mtxCurrent);
            this.node.mtxLocal.copy(Cube.indentity);
            this.rotateTextures(move);
          }
        });
        return;
      }

      this.cube.mtxLocal.copy(this.mtxCurrent);
    }

    private rotate(_node: ƒ.Node, _move: ƒ.Vector2): void {
      _node.mtxLocal.rotateX(_move.y, true);
      _node.mtxLocal.rotateY(_move.x, true);
    }

    rotateTextures(_move: ƒ.Vector2) {
      let direction: string = "left";
      if (_move.x > 0) direction = "right";
      else if (_move.y < 0) direction = "up";
      else if (_move.y > 0) direction = "down";

      let rotate: number[] = Cube.rotate[direction];
      // ƒ.Debug.log(rotate);
      let textures: ƒ.Texture[] = [];
      rotate.forEach((_index: number) => textures.push(this.textures[_index]));
      this.textures = textures;
      this.resetTextures();
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