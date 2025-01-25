namespace Script {
  import ƒ = FudgeCore;
  ƒ.Debug.info("Main Program Template running!");

  let viewport: ƒ.Viewport;
  document.addEventListener("interactiveViewportStarted", <EventListener><unknown>start);

  async function start(_event: CustomEvent): Promise<void> {
    viewport = _event.detail;
    ƒ.Debug.setFilter(ƒ.DebugTextArea, ƒ.DEBUG_FILTER.ALL);
    document.body.appendChild(ƒ.DebugTextArea.textArea);
    document.body.appendChild(document.createElement("h1"));

    const touch: ƒ.TouchEventDispatcher = new ƒ.TouchEventDispatcher(document);
    ƒ.Debug.log(touch);
    document.addEventListener(ƒ.EVENT_TOUCH.TAP, processTouch)

    const cube: ƒ.Node = viewport.getBranch().getChildrenByName("Cube")![0];
    for (let side: number = 0; side < 6; side++) {
      const node: ƒ.Node = cube.getChild(side);
      const txr: ƒ.TextureCanvas = await createTexture(side.toString());
      const mtr: ƒ.Material = new ƒ.Material(side.toString(), ƒ.ShaderFlatTextured);
      (<ƒ.CoatTextured>mtr.coat).texture = txr;
      node.removeComponent(node.getComponent(ƒ.ComponentMaterial));
      node.addComponent(new ƒ.ComponentMaterial(mtr));
    }

    ƒ.Loop.addEventListener(ƒ.EVENT.LOOP_FRAME, update);
    ƒ.Loop.start();  // start the game loop to continously draw the viewport, update the audiosystem and drive the physics i/a
  }

  function update(_event: Event): void {
    // ƒ.Physics.simulate();  // if physics is included and used
    viewport.draw();
    ƒ.AudioManager.default.update();
  }

  function processTouch(_event: ƒ.EventUnified) {
    console.log(_event);
  }

  async function createTexture(_text: string): Promise<ƒ.TextureCanvas> {
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


}