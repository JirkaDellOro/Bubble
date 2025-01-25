"use strict";
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    ƒ.Project.registerScriptNamespace(Script); // Register the namespace to FUDGE for serialization
    class Cube extends ƒ.ComponentScript {
        // Register the script as component for use in the editor via drag&drop
        static { this.iSubclass = ƒ.Component.registerSubclass(Cube); }
        constructor() {
            super();
            this.mtxCurrent = new ƒ.Matrix4x4();
            // Activate the functions of this component as response to events
            this.hndEvent = (_event) => {
                switch (_event.type) {
                    case "componentAdd" /* ƒ.EVENT.COMPONENT_ADD */:
                        this.node.addEventListener("pointerdown", this.hndPointerEvent);
                        this.node.addEventListener("pointermove", this.hndPointerEvent);
                        this.node.addEventListener("pointerup", this.hndPointerEvent);
                        this.node.addEventListener("reset", this.reset, true);
                        break;
                    case "componentRemove" /* ƒ.EVENT.COMPONENT_REMOVE */:
                        this.removeEventListener("componentAdd" /* ƒ.EVENT.COMPONENT_ADD */, this.hndEvent);
                        this.removeEventListener("componentRemove" /* ƒ.EVENT.COMPONENT_REMOVE */, this.hndEvent);
                        break;
                    case "nodeDeserialized" /* ƒ.EVENT.NODE_DESERIALIZED */:
                        // this.node.addEventListener(ƒ.EVENT.CHILD_APPEND, (_event: Event) => {
                        this.cube = this.node.getParent();
                        this.mtxCurrent.copy(this.cube.mtxLocal.clone);
                        // });
                        break;
                }
            };
            this.hndPointerEvent = (_event) => {
                console.log(_event.type);
                switch (_event.type) {
                    case "pointerdown":
                        this.start = new ƒ.Vector2(_event.offsetX, _event.offsetY);
                        this.mtxCurrent.copy(this.cube.mtxLocal.clone);
                        break;
                    case "pointermove":
                        if (!this.start)
                            return;
                        const move = this.calcMove(_event);
                        this.cube.mtxLocal.copy(this.mtxCurrent);
                        this.rotate(this.cube, move);
                        ƒ.Recycler.store(move);
                        break;
                    case "pointerup":
                        this.reset(_event);
                        break;
                }
            };
            this.reset = (_event) => {
                if (!this.start)
                    return;
                const move = this.calcMove(_event instanceof PointerEvent ? _event : _event.detail);
                this.start = null;
                ƒ.DebugTextArea.textArea.style.backgroundColor = "green";
                if (move.magnitude > 9.9) {
                    ƒ.DebugTextArea.textArea.style.backgroundColor = "red";
                    const step = 6;
                    if (Math.abs(move.x) > Math.abs(move.y))
                        move.set(move.x = move.x < 0 ? -step : step, 0);
                    else
                        move.set(0, move.y = move.y < 0 ? -step : step);
                    ƒ.Time.game.setTimer(30, 90 / step, (_event) => {
                        this.rotate(this.node, move);
                        if (_event.lastCall)
                            this.cube.mtxLocal.copy(this.mtxCurrent);
                    });
                    return;
                }
                this.cube.mtxLocal.copy(this.mtxCurrent);
            };
            this.calcMove = (_event) => {
                let move = ƒ.Recycler.get(ƒ.Vector2);
                move.set(_event.offsetX - this.start.x, this.start.y - _event.offsetY);
                let mag = move.magnitude;
                if (mag > 10)
                    move.normalize(10);
                return move;
            };
            // Don't start when running in editor
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            // Listen to this component being added to or removed from a node
            this.addEventListener("componentAdd" /* ƒ.EVENT.COMPONENT_ADD */, this.hndEvent);
            this.addEventListener("componentRemove" /* ƒ.EVENT.COMPONENT_REMOVE */, this.hndEvent);
            this.addEventListener("nodeDeserialized" /* ƒ.EVENT.NODE_DESERIALIZED */, this.hndEvent);
        }
        async setTextures(_content) {
            for (let i = 0; i < 6; i++) {
                const side = this.node.getChild(i);
                const txr = await this.createTexture(_content[i].toString());
                const mtr = new ƒ.Material(i.toString(), ƒ.ShaderFlatTextured);
                mtr.coat.texture = txr;
                side.removeComponent(side.getComponent(ƒ.ComponentMaterial));
                side.addComponent(new ƒ.ComponentMaterial(mtr));
            }
        }
        async createTexture(_text) {
            const size = 100;
            const canvas = new OffscreenCanvas(size, size);
            const crc2 = canvas.getContext("2d");
            const txr = new ƒ.TextureCanvas("canvas", crc2);
            crc2.fillStyle = "yellow";
            crc2.fillRect(0, 0, canvas.width, canvas.height);
            crc2.fillStyle = "black";
            crc2.strokeStyle = "black";
            crc2.font = "50px serif";
            crc2.fillText(_text, 0, 80, 100);
            crc2.fill();
            let text = document.createElement("span");
            text.innerHTML = "eins zwei drei vier fünf sechs sieben acht";
            drawHtmlDom(text, 0, 0, canvas.width, canvas.height);
            async function drawHtmlDom(_html, _x, _y, _width, _height) {
                var d = "data:image/svg+xml,";
                d += "<svg xmlns='http://www.w3.org/2000/svg' width='" + _width + "' height='" + _height + "' >";
                d += "<foreignObject width='100%' height ='100%'>";
                d += "<div xmlns='http://www.w3.org/1999/xhtml'>";
                d += _html.outerHTML;
                d += "</div></foreignObject></svg>";
                var i = new Image();
                i.src = d;
                crc2.drawImage(i, _x, _y);
                // i.onload = await async function (): Promise<void> {
                // };
            }
            return txr;
        }
        rotate(_node, _move) {
            _node.mtxLocal.rotateX(_move.y, true);
            _node.mtxLocal.rotateY(_move.x, true);
        }
    }
    Script.Cube = Cube;
})(Script || (Script = {}));
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    ƒ.Debug.info("Main Program Template running!");
    let viewport;
    let cubes;
    let graph;
    document.addEventListener("interactiveViewportStarted", start);
    async function start(_event) {
        viewport = _event.detail;
        viewport.camera.mtxPivot.translateZ(-5);
        graph = viewport.getBranch();
        // setup audio
        let cmpListener /* : ƒ.ComponentAudioListener */ = new ƒ.ComponentAudioListener();
        graph.addComponent(cmpListener);
        ƒ.AudioManager.default.listenWith(cmpListener);
        ƒ.AudioManager.default.listenTo(graph);
        ƒ.Debug.log("Audio:", ƒ.AudioManager.default);
        // draw viewport once for immediate feedback
        ƒ.Render.prepare(graph);
        viewport.draw();
        // dispatch event to signal startup done
        ƒ.Debug.setFilter(ƒ.DebugTextArea, ƒ.DEBUG_FILTER.ALL);
        document.body.appendChild(ƒ.DebugTextArea.textArea);
        // const touch: ƒ.TouchEventDispatcher = new ƒ.TouchEventDispatcher(document);
        // ƒ.Debug.log(touch);
        // document.addEventListener(ƒ.EVENT_TOUCH.TAP, hndEvent)
        document.addEventListener("pointerdown", hndEvent);
        document.addEventListener("pointermove", hndEvent);
        document.addEventListener("pointerup", hndEvent);
        cubes = viewport.getBranch().getChildrenByName("Cube");
        let indices = ["a", "b", "c"];
        for (let cube of cubes) {
            let index = indices.shift();
            let content = ["0" + index, "1" + index, "2" + index, "3" + index, "4" + index, "5" + index];
            await cube.getChild(0).getComponent(Script.Cube).setTextures(content);
        }
        ƒ.Loop.addEventListener("loopFrame" /* ƒ.EVENT.LOOP_FRAME */, update);
        ƒ.Loop.start(); // start the game loop to continously draw the viewport, update the audiosystem and drive the physics i/a
    }
    function update(_event) {
        // ƒ.Physics.simulate();  // if physics is included and used
        viewport.draw();
        ƒ.AudioManager.default.update();
    }
    function hndEvent(_event) {
        for (let cube of cubes)
            cube.getChild(0).radius = 0.5; //smaller radius for picking
        viewport.dispatchPointerEvent(_event);
        switch (_event.type) {
            case ("pointerup"):
                graph.broadcastEvent(new CustomEvent("reset", { detail: _event }));
                break;
        }
    }
})(Script || (Script = {}));
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    ƒ.Project.registerScriptNamespace(Script); // Register the namespace to FUDGE for serialization
    class Wobble extends ƒ.ComponentScript {
        // Register the script as component for use in the editor via drag&drop
        static { this.iSubclass = ƒ.Component.registerSubclass(Wobble); }
        #cmpMeshPivot;
        constructor() {
            super();
            // Activate the functions of this component as response to events
            this.hndEvent = (_event) => {
                switch (_event.type) {
                    case "componentAdd" /* ƒ.EVENT.COMPONENT_ADD */:
                        this.node.addEventListener("renderPrepare" /* ƒ.EVENT.RENDER_PREPARE */, this.hndEvent);
                        break;
                    case "componentRemove" /* ƒ.EVENT.COMPONENT_REMOVE */:
                        this.removeEventListener("componentAdd" /* ƒ.EVENT.COMPONENT_ADD */, this.hndEvent);
                        this.removeEventListener("componentRemove" /* ƒ.EVENT.COMPONENT_REMOVE */, this.hndEvent);
                        break;
                    case "nodeDeserialized" /* ƒ.EVENT.NODE_DESERIALIZED */:
                        this.#cmpMeshPivot = this.node.getComponent(ƒ.ComponentMesh).mtxPivot;
                        break;
                    case "renderPrepare" /* ƒ.EVENT.RENDER_PREPARE */:
                        console.log("Prepare");
                        this.#cmpMeshPivot.scaling = new ƒ.Vector3(ƒ.Random.default.getRange(0.8, 1.2), ƒ.Random.default.getRange(0.8, 1.2), ƒ.Random.default.getRange(0.8, 1.2));
                        break;
                }
            };
            // Don't start when running in editor
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            // Listen to this component being added to or removed from a node
            this.addEventListener("componentAdd" /* ƒ.EVENT.COMPONENT_ADD */, this.hndEvent);
            this.addEventListener("componentRemove" /* ƒ.EVENT.COMPONENT_REMOVE */, this.hndEvent);
            this.addEventListener("nodeDeserialized" /* ƒ.EVENT.NODE_DESERIALIZED */, this.hndEvent);
        }
    }
    Script.Wobble = Wobble;
})(Script || (Script = {}));
//# sourceMappingURL=Script.js.map