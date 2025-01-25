declare namespace Script {
    import ƒ = FudgeCore;
    class Cube extends ƒ.ComponentScript {
        static readonly iSubclass: number;
        private start;
        private mtxCurrent;
        private cube;
        constructor();
        hndEvent: (_event: Event) => void;
        private hndPointerEvent;
        private reset;
        private rotate;
        private calcMove;
    }
}
declare namespace Script {
}
declare namespace Script {
    import ƒ = FudgeCore;
    class Wobble extends ƒ.ComponentScript {
        #private;
        static readonly iSubclass: number;
        constructor();
        hndEvent: (_event: Event) => void;
    }
}
