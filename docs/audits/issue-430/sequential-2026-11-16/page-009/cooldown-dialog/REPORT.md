# Trade mobile cooldown dialog

[STRICT-TRADE-005](https://github.com/anugaweerasinghe1-del/trading101/issues/430#issuecomment-6966969623) is a reproduced product defect. At 390px and 430px the order drawer intercepts the warning's cancel click and the warning is excluded from the accessibility tree. At 1440px the underlying order form is not a modal, and the same warning can receive the pointer. The separate compiled-before and two production mobile observations agree. The public fixture used explicit browser-local recent-loss state and did not complete an order.

The candidate uses the existing modal dialog with the warning name and description. It holds keyboard focus while active and restores focus to the order action on cancellation. The five-second gate, conditional reminder, body copy, colors, order data and explicit Proceed action remain the same. Cancel, the standard Close control or Escape dismiss the warning without completing an order. Outside interaction does not dismiss it.

Current candidate passes full Cloudflare build/postbuild and TypeScript. The compiled browser captures verify mobile cancellation at 390px, Escape at 430px, cancellation on the BTC asset route and a deliberate post-countdown desktop proceed against disposable loopback guest storage. Before going to production this must pass exact-head required CI, immutable Pages preview, protected merge, native production observation and independent custom-domain readback. Complete the preceding #467 native receipt before superseding its deployment.

P09 continues to have partial audit coverage. Signed-in account/quote behavior and remaining public order states retain separate scope.
