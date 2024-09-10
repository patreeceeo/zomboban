#!/bin/sh

UUID_FORMAT_PANE="#{session_name}:#{window_id}.#{pane_id}"

string_is_not_empty() {
  [ -n "$1" ]
}

list_get_item() {
  string="$1"
  index="$2"
  count=0

    # Split the string into words using the shell's word splitting
    for item in $string; do
      if [ "$count" -eq "$index" ]; then
        echo "$item"
        return
      fi
      count=$((count + 1))
    done

    # If the index is out of bounds, return an empty string
    echo ""
  }

wm_session_new () {
  tmux new-session -s "$1" -d

  tmux bind -T copy-mode-vi MouseDragEnd1Pane send-keys -X copy-pipe-and-cancel "xclip -i -f -selection primary | xclip -i -selection clipboard"

  tmux display-message -p -t "$1" "#{session_id}"
}

wm_session_exists () {
  session_list="$(tmux list-sessions -F "#{session_id}: #{session_name}")"
  grep_result="$(echo "$session_list" | grep "$1")"
  string_is_not_empty "$grep_result"
}

##
# Return the current session's UUID
wm_session_current () {
  tmux display-message -p "#{session_id}"
}

wm_session_current_name () {
  tmux display-message -p "#{session_name}"
}

wm_session_kill() {
  tmux kill-session -t "$1"
}

wm_session_kill_other () {
  if [ "$1" != "$(wm_session_current)" ] && [ "$1" != "$(wm_session_current_name)" ]; then
    wm_session_kill "$1"
  fi
}

wm_session_attach () {
  tmux attach -t "$1"
}

wm_session_list_panes () {
  tmux list-panes -t "$1" -F $UUID_FORMAT_PANE
}

##
# Return the current pane's UUID
wm_pane_current () {
  tmux display-message -p $UUID_FORMAT_PANE
}

wm_pane_split() {
  tmux split-window -t "$1" "-$2" "$3"
  wm_pane_current
}

wm_pane_select() {
  tmux select-pane -t "$1"
}

wm_pane_new_left () {
  wm_pane_split "$1" hb "$2"
}

wm_pane_new_right () {
  wm_pane_split "$1" h "$2"
}

wm_pane_new_above () {
  wm_pane_split "$1" vb "$2"
}

wm_pane_new_below () {
  wm_pane_split "$1" v "$2"
}

wm_pane_do () {
  tmux send-keys -t "$1" "$2" C-m
}
