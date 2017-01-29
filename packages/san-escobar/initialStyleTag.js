module.exports = `
    <style>
        body {
            cursor: default;
            line-height: 1.4;
        }
        button {
            cursor: pointer;
            border: 1px solid rgba(255, 230, 180, 1);
            background: rgba(255, 230, 180, 0.6);
            border-radius: 4px;
        }

        .hide {
            background: rgba(255, 100, 80, 0.3);
        }
        input[disabled] {
            color: black;
        }
        ul {
            margin: 0;
        }
        li {
            list-style-type: none;
        }
        .call {
            color: #139;
            font-weight: bold;
        }
        .ret {
            color: #080;
            font-weight: bold;
        }
        .get {
            color: #a22;
            font-weight: bold;
        }
        .set {
            color: #eb0;
            stext-shadow: 0 0 3px #a22;
            font-weight: bold;
        }
        .new {
            color: violet;
            font-weight: bold;
        }


        .hidden {
            display: none;
        }

        body {
            font-family: sans-serif;
        }

        b {
            opacity: 0.8;
        }

        .function {
            font-style: italic;
            color: #728;
        }

        .value.number {
            color: #e00;
        }

        .value.string {
            color: #00e;
        }

        .value.null, .value.undefined {
            color: #666;
        }

        .name.undefined, .name.null {
            opacity: 0.5;
        }

        .value.boolean.true {
            color: green;
        }

        .value.boolean.false {
            color: red;
            stransform: scale(1.4) translateY(-2px);
            sdisplay: inline-block;
        }

        .value.string.path {
            text-decoration: u⇄↔nderline;
        }

        .value.circular {
            color: #64f;
        }


        ul {
            border-left: 1px solid rgba(240, 100, 50, 0.4);
        }
        .event:hover {
            background: rgba(0, 0, 0, 0.02);
            outline: 1px solid rgba(0, 0, 0, 0.2);
        }



    </style>`;
