function! s:prettier()
  let l:file = expand('%')
  let l:prettier = system('yarn prettier --write ' . l:file)
  if v:shell_error
    echo l:prettier
  else
    echom 'Prettier ran successfully'
    " reload the buffer
    e
  endif
endfunction

autocmd BufWritePost *.ts call s:prettier()
