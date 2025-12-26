'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

interface CollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  videoId?: string;
}

interface PlaybackState {
  currentTime: number;
  originalDuration: number;
  isPlaying: boolean;
  playbackRate: number;
  hasAudio: boolean;
  audioTrackDuration: number;
  activeUsers: number;
}

interface Participant {
  id: string;
  username: string;
  role: 'viewer' | 'editor' | 'admin';
  isController: boolean;
}

export default function CollaborationModal({ isOpen, onClose, projectId, videoId }: CollaborationModalProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isController, setIsController] = useState(false);
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    currentTime: 0,
    originalDuration: 120,
    isPlaying: false,
    playbackRate: 1.0,
    hasAudio: false,
    audioTrackDuration: 0,
    activeUsers: 0
  });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor' | 'admin'>('viewer');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [eventLog, setEventLog] = useState<Array<{message: string, type: string, timestamp: Date}>>([]);
  
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !socket) {
      connectWebSocket();
    }
    
    return () => {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    };
  }, [isOpen]);

  const connectWebSocket = () => {
    const newSocket = io('http://localhost:3000');
    
    newSocket.on('connect', () => {
      setIsConnected(true);
      addLog('Connected to collaboration server', 'success');
      authenticate(newSocket);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      setIsAuthenticated(false);
      addLog('Disconnected from server', 'error');
    });

    newSocket.on('authenticated', (data) => {
      setIsAuthenticated(true);
      addLog(`Authenticated as ${data.username}`, 'success');
    });

    newSocket.on('playback_state', (state: PlaybackState) => {
      setPlaybackState(state);
      addLog(`Playback state updated: ${state.isPlaying ? 'Playing' : 'Paused'} at ${state.currentTime.toFixed(1)}s`, 'info');
    });

    newSocket.on('playback_control', (data) => {
      if (data.currentTime !== undefined) {
        setPlaybackState(prev => ({ ...prev, currentTime: data.currentTime }));
      }
      if (data.playbackRate !== undefined) {
        setPlaybackState(prev => ({ ...prev, playbackRate: data.playbackRate }));
      }
      setPlaybackState(prev => ({ ...prev, isPlaying: data.action === 'play' }));
      addLog(`${data.initiatedBy?.username || 'Someone'} ${data.action} at ${data.currentTime?.toFixed(1) || 0}s`, 'info');
    });

    newSocket.on('user_joined', (data) => {
      updateParticipants();
      addLog(`${data.user.username} joined the session`, 'success');
    });

    newSocket.on('user_left', (data) => {
      updateParticipants();
      addLog(`${data.user.username} left the session`, 'warning');
    });

    newSocket.on('control_granted', () => {
      setIsController(t};

  )
    </div>/div>v>
      <</di        div>
    </      iv>
    </d
               ))}    
     </div>        e}
      ssagentry.me}] {ring()eTimeSttamp.toLocalentry.times     [{                    >
      }
     }`              '
  ext-blue-400't                    
low-400' : ? 'text-yelng' === 'warniry.typeent              :
      -400'  'text-red= 'error' ?ntry.type ==    e               
 en-400' : 'text-grecess' ?sucy.type === '        entr           ${
  b-1={`mlassName       c      
     ndex}y={ike            v
       <di            x) => (
   y, indeentr((.map  {eventLog    ">
        -sm text-monofonty-auto 48 overflow-d-lg p-4 h-underoate-800 slame="bg-assN <div cl
                    
   ></div          button>
           </      Clear Log
         🗑️       >
          s"
    on-colortihite transi:text-wy-400 hovere="text-gralassNam    c     ])}
       tEventLog([) => se{(nClick=     o          <button
                  </h3>
         vent Log
  -time E  📋 Real           2">
   -center gap- flex itemsted text-whibolmi font-se-lgxtame="teh3 classN   <           -4">
center mbems--between itstifyex ju"flme=iv classNa         <d">
   ed-lg p-6e-700 round="bg-slativ className          <d}
og */ent L    {/* Ev

       </div>        /div>
         <>
    </button           rol
   ant Cont  🎮 Gr            >
          "
      colorssition--medium traned-lg font2 roundite px-4 py-xt-wh-600 teray-gd:bg disable700-orange- hover:bg600orange-bg-ame="classN               roller}
 sContbled={!idisa          
      tton         <bu>
     </button             n
 ate Sessiore       🏗️ C>
                     
  ors"nsition-coldium trat-me fonrounded-lg px-4 py-2 -whitee-700 text:bg-purploverrple-600 h-puassName="bgcl         }
       on{createSessiick=        onCl        <button
         ap">
      flex-wr-3x gapme="flediv classNa <           trols */}
 Con{/* Session           iv>

   </d       >
   on</butt              d Invite
   📧 Sen                   >

        s"-colortion transiediumfont-m rounded-lg py-2te px-4 t-whiray-600 texg-g:bdisabled700 :bg-pink--600 hover="bg-pinkssName       cla        cated}
 uthentiled={!isAdisab         }
       ={sendInvite  onClick            n
  <butto      
        elect>       </s>
       in</optionin">Admvalue="admon   <opti       on>
       Editor</optiitor">"edalue=option v     <       on>
    pti">Viewer</oewer"viue=ption val<o                     >
        
 00"ue-5-blcus:border-none focus:outlinehite fot-wded-lg texroune-600 slater border-ate-800 bord-slbgpy-2 "px-3 lassName=    c     }
       | 'admin') | 'editor'  'viewer'lue asvat.ole(e.targeetInviteR => s(e)  onChange={           
   le}Roalue={invite        v     lect
    <se           />
                lue-500"
cus:border-b fononee-outlins:curay-400 for-gceholdete pla text-whiounded-lglate-600 rorder-srder b-800 bo-2 bg-slate px-3 py00px]1 min-w-[2="flex-lassName   c            nvite"
  iemail toder="Enter    placehol         e)}
    et.valutargeEmail(e.nvit) => setIChange={(e on     
          ail}eEmalue={invit      v          ail"
"em type=         put
      <in      ">
        ex-wrap-3 mb-4 fl"flex gapv className=         <di/}
   m ** Invite For      {/
       </div>
             ))}
       >
            </div   r)'}
      ontrolleer && '(CntrollCoipant.isticname} {part.userrticipan{pa                  />
ull" ed-f0 round-402 bg-greenh-Name="w-2   <div class                       >
       }`}
                    y-300'
 text-gra-slate-600' : 'bgwhiten-600 text-reebg-gler ? 'isControlrticipant.          pa        -2 ${
  r gap items-centext-sm flexteull rounded-fpy-2 ={`px-3  className              
   id}cipant.tiey={par           k      iv
       <d       
   pant => (rticis.map(paarticipant {p    
         ">4ap mb- flex-wrp-2"flex game=div classNa    </}
        ticipants ** Par    {/ 
        
           /h3> <       
    sion & Inviteatollabor  👥 Team C        ">
    -2apems-center glex itte mb-4 fold text-whisemibfont-"text-lg ame= classN  <h3   ">
       lg p-6 mb-6700 rounded--slate-e="bgsNam <div clas      n */}
   boratiom Colla  {/* Tea     
     </div>
      iv>
        </d
       </button>       
      onVideo Sessi   🎥 Join    
                     >
   olors"ion-cm transitdiufont-me rounded-lg px-4 py-2ite -whay-600 textgrisabled:bg-een-700 d hover:bg-green-600bg-grassName="   cl      
       nticated}ed={!isAuthe   disabl           ession}
  oSide{joinVonClick=              n
       <butto  
       ton>ut </b            ed
 🏃 1.5x Spe                  >
         lors"
   ransition-coedium td-lg font-mnde-2 roue px-4 pyext-whit600 tgray-d:bg- disableblue-700 hover:bg-ue-600e="bg-blNam    class        ler}
    rol!isCont={ed     disabl
           1.5)}rentTime, ckState.cur, playbae_change'ol('ratackContrlayb=> handleP)   onClick={(            utton
        <b
        utton>  </b        
    eek to 30s ⏭️ S       
         >            
 -colors"ransitionnt-medium tnded-lg fo-4 py-2 rout-white px00 texbg-gray-6bled:disaue-700 over:bg-bl600 hue-bg-blame="      classN          
oller}!isContred={  disabl         30)}
     , eek'trol('sybackConla> handlePick={() =    onCl       on
            <butt  on>
        </butt     
      ause        ⏸️ P
              >
        s"n-colortransitiodium  font-me2 rounded-lgpy-4 -white px-extray-600 t-g:bg disabledblue-700bg-0 hover:lue-60sName="bg-bclas               troller}
 Conbled={!issa   di         e')}
    us'paol(ybackContrePla{() => handl onClick=             
  button       <n>
       </butto         ay
     ️ Pl           ▶
     >              
s"tion-colornsiium trag font-med2 rounded-lpx-4 py- text-white 600y-g-graisabled:bue-700 d:bg-bl hoverblue-600g-sName="b        clas      ler}
  isControlabled={!         dis   
    ay')}plntrol('ckCoePlaybadl() => hanick={nCl   o             <button
     
         p">lex-wra-3 fapex g"flassName=  <div cl         
 ls */}Controk aybac      {/* Pl

          </div>      >
        </div        
n)}Duratioginale.oriState(playbackim{formatTentTime)} / .currtatelaybackSormatTime(p         {f
       00">"text-gray-3 className=    <div              </div>
             />
           
  %` }}n) * 100}Duratioiginalate.orybackSte / plae.currentTimplaybackStat${(t: ` lef    style={{              1/2"
translate-x-ansform - trinterll cursor-poounded-fu400 rblue-w-4 h-4 bg-6px] lute top-[-ame="absolassN    c    
                <div          />
                 %` }}
* 100}) urationlDate.originaplaybackStntTime / te.curreStaack`${(playbwidth: style={{                  "
 on-100l duratisition-alan tr-full500 roundedue-h-full bg-blassName="      cl     v 
             <di       >
               
  ick}neCldleTimelian={h     onClick          4"
  mb-vetiinter relapoor-l cursed-ful0 round60-2 bg-slate-"w-full hclassName=            Ref}
    timelineef={  r        
        <div      v>
       Player</di Demo Video ite mb-4">📹me="text-whsNaas <div cl            mb-4">
  erxt-centg p-8 teunded-lrok "bg-blacassName= cl<div          
  }yer Mock *//* Video Pla         {   

v>   </di      
     </div>        iv>
    }x</dlaybackRatebackState.paymibold">{plite font-see="text-whamv classN  <di       v>
       k Rate</dibac-1">Playgray-400 mbt-xs text-texame="div classN  <            -lg">
  -3 roundede-800 pg-slatName="b <div class         >
          </div
        1)}s</div>ixed(rentTime.toFckState.curd">{playbafont-semibole whitt-"texsName=   <div clas       >
      nt Time</divb-1">Curre-gray-400 ms text"text-xName=<div class             lg">
   ounded- r-800 p-3slate="bg-assNamediv cl      <     
       </div>
          (1)}s</div>edon.toFixnalDuratiState.origi">{playback-semibold font"text-whiteame=lassN c      <div      div>
    tion</1">Dura-400 mb-t-gray-xs tex="textNamess  <div cla           
   g">3 rounded-l800 p--slate-"bgssName=v cla   <di           -4 mb-6">
3 gapgrid-cols-2 md:grid-cols-"grid =assName     <div cl  
     a Grid */}dat{/* Meta                     
</h3>
             
  chronizationio Synmeline & Audideo Ti 🎬 V           >
  er gap-2"items-cente mb-4 flex ext-whitt-semibold tg fon"text-lame=assNh3 cl        <b-6">
    -6 m-lg p700 rounded"bg-slate-me=v classNa      <di}
    e & Sync */ Timelineo   {/* Vid        </div>

       v>
  di     </  on>
        </butt          g>
      </sv           
6l12 12" /> 18L18 6M6 "M6th={2} d=" strokeWidoin="roundstrokeLinej" p="roundLineca<path stroke            
      ">24 24x="0 0 viewBoor" "currentCol" stroke="none6" fill=w-6 h-sName="vg clas        <s            >
         s"
 coloransition-e trxt-whittey-400 hover:ra"text-g className=              onClose}
 lick={    onC           utton
   <b            /span>
 <           ted'}
  icaot Authent : 'Ncated'thentid ? 'Auenticateth       {isAu             }`}>
        
  white' text-g-yellow-500te' : 'b500 text-whi 'bg-green-enticated ?isAuth            d ${
    ont-semiboltext-xs ffull y-1 rounded-me={`px-3 psNa <span clas          </span>
             
    connected'}ed' : 'Disctonneted ? 'C{isConnec              }`}>
         e'
        text-whited-500ite' : 'bg-rext-wh-green-500 t ? 'bgConnected    is         d ${
   -semibol-xs fontull textounded-f3 py-1 rsName={`px-aspan cl <s           
  >ter gap-4"ems-cen"flex itlassName=  <div c         
 div>        </p>
    tion</am collaboraation and teniznchroideo sy>Real-time v-gray-400"ame="textclassN         <p     </h2>
 ionoratllabeam Cowhite">Text--bold tontl fe="text-2xassNam  <h2 cl         
      <div>
         ter mb-6">enitems-ceen -betwlex justify"fe=amsNasiv cl     <d*/}
     er  Head        {/*">
  me="p-6<div classNa">
        w-y-auto0vh] overfloll max-h-[9-4xl w-fued-xl max-wndrou-slate-800 "bg className=iv<d  4">
    er z-50 p-ntceify- justcenterflex items-acity-50 black bg-opt-0 bg-"fixed insessName=iv cla    <d
return (

  urn null; retif (!isOpen) };

  
 ')}`;, '0rt(2ng().padSta.toStri)}:${secst(2, '0'ar().padStngoStrirn `${mins.t   retus % 60);
 or(secondloMath.fcs =     const se
 / 60);(secondsth.floor mins = Ma   const) => {
 nds: number = (seco formatTimeconst  ;
  };

w Date() }])ne: mestampype, timessage, trev, { ev => [...pog(prsetEventL   ) => {
 type: stringtring, e: ssagg = (mesLo add;

  const  ]);
  }roller }
  : isContler, isControl 'admin'le:, roame: 'You'ernid: '1', us
      { pants([rtici setPaserver
   from the  come  wouldpp, thisin real a for demo - icipants part   // Mock() => {
 ipants = eParticst updat
  con};
');
  ion createdon sessoratiess('Collabt.succ;
    toasess')ucc`, 'swSessionId}sion: ${neration sesed collaboog(`Creat
    addLd);ionIssd(newSesionI    setSeste.now();
+ Daession_' 'sId = essiononst newS{
    c= () => ion  createSess
  const;

    }
  }, 'error');e'invitsend ('Failed to Log   add');
   iteend inv to sailedast.error('F      to{
) tch (error} ca
         }invite');
 d  to senedror('Failrow new Er       th} else {
     l('');
  eEmaivitetIn      s);
  'success'eRole}`, } as ${inviteEmailnvitnt to ${ig(`Invite se   addLo}`);
     nviteEmail{i to $Invite sentss(`ucce    toast.s {
    ok)f (response.     i
 );

      }       })ionId
 sess sessionId:       jectId,
   tId: prorojec        p
  viteRole,role: in       ,
    inviteEmailmail:     efy({
     N.stringidy: JSO    bo    },
    ',
    sonpplication/je': 'atent-Typ      'Conrs: {
    ade       he 'POST',
     method:', {
    tenviion/iatborlapi/col001/a:3localhost('http://ait fetchsponse = aw re      constnd
r backe call to youke an API would ma  // This{
    try   }

     return;
  ');
     l addressr an emaientee or('Pleast.err    toas
  teEmail) {nvi if (!i   
) => {ync (dInvite = as
  const sen;
Time);
  }, seekk'trol('seeaybackConePlhandl  
  ;ationinalDurtate.orig* playbackS percent  =st seekTime
    conect.width;ft) / rrect.le.clientX - rcent = (epeonst ct();
    cClientReBoundingrent.getef.curlineRt = timest rec
    conurn;
    ) retrrentelineRef.cutim ! ||llersContro    if (!i => {
DivElement>)TMLEvent<Ht.Mouse Reac= (e:melineClick Tionst handle  c
  };

Data);', controlrolck_contaybaet.emit('plck}

    sote;
    ckRate = rata.playbarolDa  conted) {
    == undefin(rate !
    if 
    };
Timeate.currentybackSt? time : pla undefined !==ime: time  currentT,
        action
    any = {ontrolData:t cns
    co }
n;
         returntrol');
ayback cot have plou do noast.error('Y     toer) {
 troll| !isCon |ocketif (!s {
    mber) =>?: nuumber, rateime?: n, ttion: string (ac =kControllePlaybac handnstco};

  info');
  ideoId}`, 'rrentVsion: ${cudeo sesviog(`Joining  addL
   

    });adata videoMettadata:  videoMe  
  ideoId,: currentV     videoIdeo', {
 id('join_vet.emit
    sockn
    };
ratioDunal.origikStateon: playbackDuratidioTrac au     io: true,
  hasAud,
    lDurationinae.origStatlaybacktion: piginalDura
      oradata = {st videoMet
    con.now()}`;|| DateId project`video_${d || eoIdeoId = vid currentVinstco   
    }

   return;t');
    nect firsease con.error('Pl      toastcated) {
entiAuthcket || !isif (!so
    ) => {ssion = (deoSet joinVi;

  cons);
  }ken'
    }mo_to'de:   token    ame,
rname: usern
      useserId,serId: u    u
  , {uthenticate'e.emit('atanc   socketIns   
 * 1000);
 h.random() at(M Math.floorser' +ername = 'U  const us
   9);).substr(2,tring(36m().toSMath.randouser_' + erId = 't usons=> {
    c) : SocketcketInstanceticate = (southen aonst
  };

  c);ckett(newSo   setSocke
 
  });  ssage);
or.meor(errst.err   toa
    'error');sage}`,or.mes ${errLog(`Error:
      add) => {', (errorrorn('erocket.o
    newS
    });
);k control'aclayb pu now have.success('Yo  toast;
    ') 'successcontrol',playback have u now Yog('dLo
      adrue);