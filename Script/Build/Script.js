"use strict";
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    ƒ.Debug.info("Main Program Template running!");
    let viewport;
    document.addEventListener("interactiveViewportStarted", start);
    async function start(_event) {
        viewport = _event.detail;
        const cube = viewport.getBranch().getChildrenByName("Cube")[0];
        for (let side = 0; side < 6; side++) {
            const node = cube.getChild(side);
            const txr = await createTexture(side.toString());
            const mtr = new ƒ.Material(side.toString(), ƒ.ShaderFlatTextured);
            mtr.coat.texture = txr;
            node.removeComponent(node.getComponent(ƒ.ComponentMaterial));
            node.addComponent(new ƒ.ComponentMaterial(mtr));
        }
        ƒ.Loop.addEventListener("loopFrame" /* ƒ.EVENT.LOOP_FRAME */, update);
        ƒ.Loop.start(); // start the game loop to continously draw the viewport, update the audiosystem and drive the physics i/a
    }
    function update(_event) {
        // ƒ.Physics.simulate();  // if physics is included and used
        viewport.draw();
        ƒ.AudioManager.default.update();
    }
    async function createTexture(_text) {
        const canvas = new OffscreenCanvas(100, 100);
        const crc2 = canvas.getContext("2d");
        const txr = new ƒ.TextureCanvas("canvas", crc2);
        crc2.fillStyle = "yellow";
        crc2.fillRect(0, 0, 100, 100);
        crc2.fillStyle = "black";
        crc2.strokeStyle = "black";
        crc2.font = "50px serif";
        crc2.fillText(_text, 0, 80, 100);
        crc2.fill();
        let text = document.createElement("span");
        text.innerHTML = "eins zwei drei vier fünf sechs siebem acht";
        drawHtmlDom(text, 0, 0, 100, 100);
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