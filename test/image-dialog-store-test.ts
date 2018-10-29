const g = global as any;

g.window = { location: "" };

import * as chai from "chai";
chai.config.includeStack = true;

const Sinon = require("sinon");

import { ImageDialogStore } from "../src/code/stores/image-dialog-store";

describe("ImageDialogStore", () => {

  beforeEach(() => {
    this.clock = Sinon.useFakeTimers();
    this.mock = Sinon.mock(ImageDialogStore.store);
  });

  afterEach(() => {
    this.clock.restore();
    this.mock.restore();
  });

  it("GraphPrimitive should exists", () => ImageDialogStore.should.exist());

  describe("the ImageDialogStore Actions", () => {
    beforeEach(() => {
      this.actions = ImageDialogStore.actions;
    });

    describe("open", () => {
      describe("with no callback", () => {
        beforeEach(() => {
          this.actions.open(false);
          this.clock.tick(1);
        });

        it("should try to keep the dialog open", () => ImageDialogStore.store.keepShowing.should.equal(true));

        it("shouldn't call 'close' when finishing", () => {
          this.mock.expects("close").never();
          this.actions.cancel();
          this.clock.tick(1);
          this.mock.verify();
        });
      });


      describe("when opened with a callback function", () => {
        beforeEach(() => {
          this.callbackF = Sinon.spy();
          this.actions.open(this.callbackF);
          this.clock.tick(1);
        });

        it("shouldn't keep the dialog open", () => ImageDialogStore.store.keepShowing.should.equal(false));

        it("should call 'close' when finishing", () => {
          this.mock.expects("close");
          this.actions.cancel();
          this.clock.tick(1);
          this.mock.verify();
        });

        it("should call the callback when finishing", () => {
          this.actions.cancel();
          this.clock.tick(1);
          this.callbackF.called.should.be.true();
        });
      });
    });
  });
});
