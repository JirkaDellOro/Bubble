"use strict";
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    ƒ.Project.registerScriptNamespace(Script); // Register the namespace to FUDGE for serialization
    class Cube extends ƒ.ComponentScript {
        // Register the script as component for use in the editor via drag&drop
        static { this.iSubclass = ƒ.Component.registerSubclass(Cube); }
        static { this.indentity = ƒ.Matrix4x4.IDENTITY(); }
        static { this.rotate = {
            left: [1, 2, 3, 0, 4, 5],
            right: [3, 0, 1, 2, 4, 5],
            up: [4, 1, 5, 3, 2, 0],
            down: [5, 1, 4, 3, 0, 2]
        }; }
        constructor() {
            super();
            this.mtxCurrent = new ƒ.Matrix4x4();
            this.textures = [];
            this.free = true;
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
                        if (this.cube)
                            this.mtxCurrent.copy(this.cube.mtxLocal.clone);
                        // });
                        break;
                }
            };
            this.hndPointerEvent = (_event) => {
                if (!this.free)
                    return;
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
                    this.free = false;
                    ƒ.DebugTextArea.textArea.style.backgroundColor = "red";
                    const step = 6;
                    if (Math.abs(move.x) > Math.abs(move.y))
                        move.set(move.x = move.x < 0 ? -step : step, 0);
                    else
                        move.set(0, move.y = move.y < 0 ? -step : step);
                    ƒ.Time.game.setTimer(30, 90 / step, (_event) => {
                        this.rotate(this.node, move);
                        if (_event.lastCall) {
                            this.cube.mtxLocal.copy(this.mtxCurrent);
                            this.node.mtxLocal.copy(Cube.indentity);
                            this.rotateTextures(move);
                            this.free = true;
                        }
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
                let texture;
                if (_content[i] instanceof Request) {
                    texture = new ƒ.TextureImage();
                    await (texture.load)(Reflect.get(_content[i], "url"));
                }
                else
                    texture = await this.createTexture(_content[i].toString());
                const material = new ƒ.Material(i.toString(), ƒ.ShaderFlatTextured);
                material.coat.texture = texture;
                side.removeComponent(side.getComponent(ƒ.ComponentMaterial));
                side.addComponent(new ƒ.ComponentMaterial(material));
                this.textures.push(texture);
                // this.resetTextures();
            }
        }
        resetTextures() {
            for (let i = 0; i < 6; i++) {
                const side = this.node.getChild(i);
                side.getComponent(ƒ.ComponentMaterial).material.coat.texture = this.textures[i];
            }
        }
        async createTexture(_text) {
            const size = 300;
            const canvas = new OffscreenCanvas(size, size);
            const crc2 = canvas.getContext("2d");
            const txr = new ƒ.TextureCanvas("canvas", crc2);
            crc2.fillStyle = "white";
            crc2.fillRect(0, 0, canvas.width, canvas.height);
            crc2.fillStyle = "black";
            crc2.strokeStyle = "black";
            crc2.font = "50px serif";
            let text = document.createElement("span");
            // text.innerHTML = "eins zwei drei vier fünf sechs sieben acht";
            text.innerHTML = "<h1 style='font-size:3em; text-align:center'>" + _text + "</h1>";
            await drawHtmlDom(text, 0, 0, canvas.width, canvas.height);
            async function drawHtmlDom(_html, _x, _y, _width, _height) {
                var d = "data:image/svg+xml,";
                d += "<svg xmlns='http://www.w3.org/2000/svg' width='" + _width + "' height='" + _height + "' >";
                d += "<foreignObject width='100%' height ='100%'>";
                d += "<div xmlns='http://www.w3.org/1999/xhtml'>";
                d += _html.outerHTML;
                d += "</div></foreignObject></svg>";
                return new Promise((_resolve, _reject) => {
                    var img = new Image();
                    img.src = d;
                    img.onload = () => {
                        crc2.drawImage(img, _x, _y);
                        _resolve();
                    };
                });
            }
            return txr;
        }
        rotate(_node, _move) {
            _node.mtxLocal.rotateX(_move.y, true);
            _node.mtxLocal.rotateY(_move.x);
        }
        rotateTextures(_move) {
            let direction = "left";
            if (_move.x > 0)
                direction = "right";
            else if (_move.y < 0)
                direction = "up";
            else if (_move.y > 0)
                direction = "down";
            let rotate = Cube.rotate[direction];
            // ƒ.Debug.log(rotate);
            let textures = [];
            rotate.forEach((_index) => textures.push(this.textures[_index]));
            this.textures = textures;
            this.resetTextures();
        }
    }
    Script.Cube = Cube;
})(Script || (Script = {}));
var Script;
(function (Script) {
    Script.data = [
        { meenzer: "Babbel!", german: "Sprich! Rede!", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Aach", german: "Auge", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Aachedeckel", german: "Augenlid", url: new Request("./Img/Questionmark.png") },
        { meenzer: "aarisch", german: "sehr", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Äbbel", german: "Äpfel", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Abbelkrotze", german: "Kerngehäuse vom Apfel", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Adschee", german: "Adieu", url: new Request("./Img/Questionmark.png") },
        { meenzer: "ald Scheckel", german: "alte Frau", url: new Request("./Img/Questionmark.png") },
        { meenzer: "alleweil", german: "jetzt sofort", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Atzel", german: "Perücke", url: new Request("./Img/Questionmark.png") },
        { meenzer: "babbisch Gutzje", german: "schmutzige Frau oder Kind", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Batschel", german: "ungeschickter Mensch", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Batschkabb", german: "Schirmmütze", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Berzel", german: "	Kopf", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Blummescherb", german: "Blumentopf aus Ton", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Blunz", german: "Blutwurst", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Bobbelche", german: "Säugling", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Bobbes", german: "Gesäß", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Bollesje", german: "Gefängnis", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Bombo", german: "Bonbon", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Borzel", german: "kleines Kind", url: new Request("./Img/Questionmark.png") },
        { meenzer: "bossele", german: "basteln", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Brockelscher", german: "Rosenkohl", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Butze", german: "Polizist", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Butzebebel", german: "Nasenpopel", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Dibbsche", german: "kleiner Topf", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Dibbe", german: "Topf", url: new Request("./Img/Questionmark.png") },
        { meenzer: "dick Blunz", german: "Schimpfwort für eine dicke Frau", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Dierschlink", german: "Türklinke", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Dorscht", german: "Durst", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Dubbee", german: "Toupet", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Dutt", german: "Tüte", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Geil", german: "Pferde", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Geilskniddel", german: "Pferdeapfel", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Gemies", german: "Gemüse", url: new Request("./Img/Questionmark.png") },
        { meenzer: "gemoschderd", german: "unmögliche Kleiderkombination", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Gutzje", german: "Bonbon", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Haggele", german: "Kiefer- oder Tannenzapfen", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Haggesjer", german: "Milchzähne", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Herrgottsdierche", german: "Marienkäfer", url: new Request("./Img/Questionmark.png") },
        { meenzer: "ibberhibbelt", german: "übersprungen oder übergangen", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Kabb", german: "Mütze", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Kabottche", german: "unmoderner Hut", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Katzuff", german: "Metzger", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Kerb", german: "Kirchweihfest", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Kerch", german: "Kirche", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Kimmche", german: "große Tasse", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Kinnerschees", german: "Kinderwagen", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Knadscher", german: "Bäcker", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Knerzje", german: "Endstück vom Brot oder Braten", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Kniddel", german: "Tierkot", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Knolle", german: "polizeiliche Geldstrafe", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Kobberd", german: "Kopfsprung", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Krebbel", german: "Berliner bzw. Krapfen", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Krimmele", german: "Krümel", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Lomberie", german: "Bodenabschlussleiste an der Wand", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Lattwerch", german: "steif gekochtes Zwetschgenmus", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Liehbeidel", german: "Lügner", url: new Request("./Img/Questionmark.png") },
        { meenzer: "machulle", german: "bankrott", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Meggeldasch", german: "Einkaufstasche", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Mick", german: "Mücke", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Mickeblatsch", german: "Fliegenklatsche", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Mutsch", german: "Kosewort für Mutter", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Nuddelche", german: "Schnuller", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Nuddelfläschje", german: "Trinkflasche mit Sauger", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Oongstschisser", german: "ängstlicher Mensch", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Oonk", german: "Genick", url: new Request("./Img/Questionmark.png") },
        { meenzer: "oogeduddelt", german: "angetrunken", url: new Request("./Img/Questionmark.png") },
        { meenzer: "pischbern", german: "flüstern", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Prottsche", german: "polizeiliche Geldstrafe", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Quetsche", german: "Zwetschgen bzw. Pflaumen", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Rachebutzer", german: "saurer Wein", url: new Request("./Img/Questionmark.png") },
        { meenzer: "rack", german: "steif", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Reitschul", german: "Kinderkarussell", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Ribbelkuche", german: "Streuselkuchen", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Rotzfohn", german: "Taschentuch", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Rullo", german: "Jalousie", url: new Request("./Img/Questionmark.png") },
        { meenzer: "schebb", german: "schief und krumm", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Schelleklobbe", german: "klingeln und dann wegrennen", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Schinnos", german: "Luder", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Schlebbche", german: "Schleifchen", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Schlibber", german: "Holzsplitter in der Haut", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Schlickse", german: "Schluckauf", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Schlobb", german: "Schleife", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Schminzje", german: "zierliches Kind", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Schmiss", german: "Schläge", url: new Request("./Img/Questionmark.png") },
        { meenzer: "schneegelisch", german: "wählerisch beim Essen", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Schnorres", german: "Schnauzbart", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Schnut", german: "Mund", url: new Request("./Img/Questionmark.png") },
        { meenzer: "schnuddelisch", german: "unsauber", url: new Request("./Img/Questionmark.png") },
        { meenzer: "schnuckele", german: "naschen", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Schockelgaul", german: "Schaukelpferd", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Schrumbele", german: "Falten im Gesicht", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Säckel", german: "Tasche in Kleidungsstücken", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Spätzje", german: "Penis", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Stiftekopp", german: "kurz geschnittene Haare", url: new Request("./Img/Questionmark.png") },
        { meenzer: "strunzen", german: "angeben", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Strunzer", german: "Prahler", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Stumbe", german: "Zigarre", url: new Request("./Img/Questionmark.png") },
        { meenzer: "vebummbeidelt", german: "verschlampt", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Verdel", german: "achtel Liter Wein", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Verdelsbutze", german: "Polizist in einem Stadtteil", url: new Request("./Img/Questionmark.png") },
        { meenzer: "veklebbern", german: "verrühren", url: new Request("./Img/Questionmark.png") },
        { meenzer: "veklickern", german: "genau erklären", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Wombe", german: "dicker Bauch", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Welljerholz", german: "Nudelholz", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Worscht", german: "Wurst", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Worzelberscht", german: "Wurzelbürste", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Wutz", german: "Schwein", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Wutzebeehle", german: "schlampige Frau", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Zibbelsche", german: "Endstück der Wurst", url: new Request("./Img/Questionmark.png") },
        { meenzer: "zobbele", german: "zupfen", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Zores", german: "Gesindel", url: new Request("./Img/Questionmark.png") },
        { meenzer: "Zwerndobbsch", german: "kleines lebhaftes Kind", url: new Request("./Img/Questionmark.png") }
    ];
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
        // document.body.appendChild(ƒ.DebugTextArea.textArea);
        // const touch: ƒ.TouchEventDispatcher = new ƒ.TouchEventDispatcher(document);
        // ƒ.Debug.log(touch);
        // document.addEventListener(ƒ.EVENT_TOUCH.TAP, hndEvent)
        document.addEventListener("pointerdown", hndEvent);
        document.addEventListener("pointermove", hndEvent);
        document.addEventListener("pointerup", hndEvent);
        cubes = viewport.getBranch().getChildrenByName("Cube");
        // let indices: string[] = ["a", "b", "c"];
        let contents = [
            [Script.data[0].url, Script.data[1].url, Script.data[0].german, Script.data[1].meenzer, Script.data[2].meenzer, Script.data[2].german],
            [Script.data[2].german, Script.data[1].url, Script.data[0].german, Script.data[0].meenzer, Script.data[1].meenzer, Script.data[2].german],
            [Script.data[1].meenzer, Script.data[1].url, Script.data[0].german, Script.data[1].meenzer, Script.data[0].meenzer, Script.data[1].german]
        ];
        let index = 0;
        for (let cube of cubes) {
            // let index: string = indices.shift();
            let content = contents[index];
            // let content: Content[] = ["0" + index,"1" + index,"2" + index,"3" + index,"4" + index,"5" + index];
            await cube.getChild(0).getComponent(Script.Cube).setTextures(content);
            index++;
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