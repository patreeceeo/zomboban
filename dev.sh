#!/bin/sh

SESSION_NAME="zomboban"

EXISTING_INSTANCE=$(tmux list-clients -F \#S | grep "$SESSION_NAME")

if [ -n "$EXISTING_INSTANCE" ]; then
  tmux attach -t $SESSION_NAME
  exit 0
fi

tmux new -s $SESSION_NAME -d

tmux bind -T copy-mode-vi MouseDragEnd1Pane send-keys -X copy-pipe-and-cancel "xclip -i -f -selection primary | xclip -i -selection clipboard"

tmux split-window -h

tmux select-pane -t 0
tmux split-window -v
tmux split-window -v
tmux split-window -v

tmux select-pane -t 0
tmux send-keys "yarn test-dev" C-m

tmux select-pane -t 1
tmux send-keys "yarn dev" C-m

tmux select-pane -t 2
tmux send-keys "yarn playwright test --ui" C-m

tmux select-pane -t 4
tmux send-keys "nvim" C-m

tmux attach -t $SESSION_NAME
