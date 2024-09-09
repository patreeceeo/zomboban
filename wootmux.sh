#!/bin/sh

wm_session_new () {
  id=$(tmux new-session -P -s "$1" -d)

  tmux bind -T copy-mode-vi MouseDragEnd1Pane send-keys -X copy-pipe-and-cancel "xclip -i -f -selection primary | xclip -i -selection clipboard"

  echo "$id"
}

wm_session_exists () {
  tmux list-clients -F \#S | grep "$1"
}

wm_session_attach () {
  tmux attach -t "$1"
}

wm_session_active_pane() {
  tmux run "echo '#{pane_id}'"
}

wm_pane_split() {
  tmux split-window "-$1P" "$2"
}

wm_pane_select() {
  tmux select-pane -t "$1"
}

wm_pane_new_left () {
  wm_pane_select "$1"
  wm_pane_split hb "$2"
}

wm_pane_new_right () {
  wm_pane_select "$1"
  wm_pane_split h "$2"
}

wm_pane_new_above () {
  wm_pane_select "$1"
  wm_pane_split vb "$2"
}

wm_pane_new_below () {
  wm_pane_select "$1"
  wm_pane_split v "$2"
}

wm_pane_do () {
  wm_pane_select "$1"
  tmux send-keys "$2" C-m
}
