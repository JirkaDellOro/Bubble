namespace Script {
  import ƒ = FudgeCore;
  ƒ.Debug.info("Main Program Template running!");

  let viewport: ƒ.Viewport;
  let cubes: ƒ.Node[];
  let graph: ƒ.Node;
  document.addEventListener("interactiveViewportStarted", <EventListener><unknown>start);

  async function start(_event: CustomEvent): Promise<void> {
    viewport = _event.detail;
    viewport.camera.mtxPivot.translateZ(-5);
    graph = viewport.getBranch();


    // setup audio
    let cmpListener/* : ƒ.ComponentAudioListener */ = new ƒ.ComponentAudioListener();
    graph.addComponent(cmpListener);
    ƒ.AudioManager.default.listenWith(cmpListener);
    ƒ.AudioManager.default.listenTo(graph);
    ƒ.Debug.log("Audio:", ƒ.AudioManager.default);

    // draw viewport once for immediate feedback
    ƒ.Render.prepare(graph);
    viewport.draw();

    // dispatch event to signal startup done
    ƒ.Debug.setFilter(ƒ.DebugTextArea, ƒ.DEBUG_FILTER.ALL);
    // document.body.appendChild(ƒ.DebugTextArea.textArea);

    // const touch: ƒ.TouchEventDispatcher = new ƒ.TouchEventDispatcher(document);
    // ƒ.Debug.log(touch);
    // document.addEventListener(ƒ.EVENT_TOUCH.TAP, hndEvent)
    document.addEventListener("pointerdown", hndEvent)
    document.addEventListener("pointermove", hndEvent)
    document.addEventListener("pointerup", hndEvent)

    cubes = viewport.getBranch().getChildrenByName("Cube");
    let indices: string[] = ["a", "b", "c"];
    for (let cube of cubes) {
      let index: string = indices.shift();
      let content: Content[] = ["0" + index,"1" + index,"2" + index,"3" + index,"4" + index,"5" + index];
      await cube.getChild(0).getComponent(Cube).setTextures(content);
    }

    ƒ.Loop.addEventListener(ƒ.EVENT.LOOP_FRAME, update);
    ƒ.Loop.start();  // start the game loop to continously draw the viewport, update the audiosystem and drive the physics i/a
  }

  function update(_event: Event): void {
    // ƒ.Physics.simulate();  // if physics is included and used
    viewport.draw();
    ƒ.AudioManager.default.update();
  }

  function hndEvent(_event: ƒ.EventUnified | PointerEvent) {
    for (let cube of cubes)
      cube.getChild(0).radius = 0.5; //smaller radius for picking

    viewport.dispatchPointerEvent(<PointerEvent>_event)
    switch (_event.type) {
      case ("pointerup"):
        graph.broadcastEvent(new CustomEvent("reset", { detail: _event }));
        break;
    }
  }
}