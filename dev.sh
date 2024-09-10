#!/bin/sh

. ./wootmux.sh

if [ "$(wm_session_exists zomboban)" ]; then
  echo "attaching to existing session"
  wm_session_attach zomboban
  exit 0
fi

wm_session_new zomboban

right_pane="$(wm_pane_current)"

wm_pane_new_left "$right_pane" nvim

wm_pane_new_below "$right_pane" "yarn test-dev"
wm_pane_new_below "$right_pane" "yarn playwright test --ui; sleep 5"
wm_pane_new_below "$right_pane" "yarn dev"

wm_session_attach zomboban

