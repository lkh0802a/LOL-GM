// New causal core: match-local event heap. No world calendar or result writer.
function matchCoreEventBefore(a,b){return a.atMs<b.atMs||(a.atMs===b.atMs&&a.seq<b.seq)}
function matchCoreQueuePush(queue,event){
  let i=queue.length;queue.push(event);
  while(i){const p=(i-1)>>1;if(!matchCoreEventBefore(event,queue[p]))break;queue[i]=queue[p];i=p}
  queue[i]=event;
}
function matchCoreQueuePop(queue){
  const first=queue[0],last=queue.pop();if(!queue.length)return first;
  let i=0;
  while(i*2+1<queue.length){let c=i*2+1;
    if(c+1<queue.length&&matchCoreEventBefore(queue[c+1],queue[c]))c++;
    if(!matchCoreEventBefore(queue[c],last))break;queue[i]=queue[c];i=c;
  }
  queue[i]=last;return first;
}
