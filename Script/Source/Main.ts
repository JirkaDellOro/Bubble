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

    document.addEventListener("pointerdown", hndEvent)
    document.addEventListener("pointermove", hndEvent)
    document.addEventListener("pointerup", hndEvent)
    graph.addEventListener("check", checkWin);

    cubes = viewport.getBranch().getChildrenByName("Cube");
    await setupCubes();

    // for (let line of data) {
    //   await fetch(line.img);
    // }

    ƒ.Loop.addEventListener(ƒ.EVENT.LOOP_FRAME, update);
    ƒ.Loop.start();  // start the game loop to continously draw the viewport, update the audiosystem and drive the physics i/a
  }

  function update(_event: Event): void {
    // ƒ.Physics.simulate();  // if physics is included and used
    viewport.draw();
    ƒ.AudioManager.default.update();
  }

  async function setupCubes(): Promise<void> {
    //create an array for controlled randomness
    let lines: number[] = [];
    for (let i: number = 0; i < data.length; i++)
      lines.push(i);

    // pick the line to ask for
    let solution: Data = data[ƒ.Random.default.splice(lines)];

    let meenzer: string[] = [];
    let german: string[] = [];
    let img: Request[] = [];

    // choose 5 wrong answers per category
    for (let i: number = 0; i < 5; i++) {
      meenzer.push(data[ƒ.Random.default.splice(lines)].meenzer);
      german.push(data[ƒ.Random.default.splice(lines)].german);
      img.push(data[ƒ.Random.default.splice(lines)].img);
    }

    // choose winning combination
    let win: number[] = [];
    for (let i: number = 0; i < 3; i++)
      win.push(ƒ.Random.default.getRangeFloored(0, 6));

    // insert correct answers at winning positions into each cube
    meenzer.splice(win[0], 0, solution.meenzer);
    german.splice(win[1], 0, solution.german);
    img.splice(win[2], 0, solution.img);


    // setup cubes with the information about the contents and the correct side
    let contents: Content[][] = [meenzer, german, img];
    for (let index in cubes) {
      let content: Content[] = contents[index];
      await cubes[index].getChild(0).getComponent(Cube).setTextures(content, win[index]);
      cubes[index].mtxLocal.rotateY(10 * (1 - Number(index)));
    }
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
  async function checkWin(): Promise<boolean> {
    let check: boolean[] = [];
    let win: boolean = true;
    for (let cube of cubes) {
      let correct: boolean = cube.getChild(0).getComponent(Cube).check()
      check.push(correct);
      if (!correct)
        win = false;
    }
    console.log(check);
    if (win) {
      showWon();
    }
    return win;
  }

  function showWon(): void {
    let dialog: HTMLDialogElement = document.createElement("dialog");
    document.body.appendChild(dialog);
    dialog.showModal();
    dialog.innerHTML = "<h1>Ei wunnerbaah!</h1>";
    dialog.addEventListener("click", () => window.location.reload());
  }
}

