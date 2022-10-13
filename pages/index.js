import styles from '../styles/Home.module.scss'
import generateScramble from 'scramble-generator';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { addDoc, collection, deleteDoc } from 'firebase/firestore';
import { db } from './db';

export default function Home({playerName, setPlayerName, playerNameRef}){
  const router = useRouter()
  const [scramble, setScramble] = useState('')
  const [time, setTime] = useState(0)
  const [timerColor, setTimerColor] = useState('black')
  const [isRunning, setIsRunning] = useState(false)
  const [solveHistory, setSolveHistory] = useState([])
  var isRunning1 = false
  var startTime = 0, endTime = 0
  var isStartDisabled = false
  var keyDownTime = 0, keyUpTime = 0;
  var isFired = false
  var isCanceled = false
  useEffect(() => {
    window.onbeforeunload = function (e) {
      console.log("unloading");
      return null;
    };
    setScramble(generateScramble())
    document.addEventListener('keydown', detectKeyDown, 'true')
    document.addEventListener('keyup', detectKeyUp, 'true')
  }, [])
  var setGreen
  function detectKeyDown(e){
    if(isFired) return
    isFired = true
    if(isRunning1) {
      setIsRunning(false)
      isRunning1 = false
      isStartDisabled = true
      if (e.key == 'Backspace') {
        isCanceled = true
      }
      return
    }
    if (e.key == 'n') setScramble(generateScramble())
    else if(e.key == ' '){
      keyDownTime = Date.now()
      setTimerColor('red')
      setGreen = setTimeout(() => {
        if (Date.now() - keyDownTime >= 500) {
          setTimerColor('green')
          setIsRunning(true)
          isRunning1 = true
          setTime(0)
          clearInterval(setGreen)
        }
      }, 500);
    }
  }
  function detectKeyUp(e){
    setTimerColor('black')
    clearInterval(setGreen)
    isFired = false
    keyUpTime = Date.now()
    if(isStartDisabled) {
      isStartDisabled = false
      return
    }
    if(keyUpTime - keyDownTime < 500) return
    if (e.key != ' ') return
    startTime = Date.now() / 1000
    const a = async () => {
      if(!isRunning1) {
        setScramble(generateScramble())
        if(isCanceled){
          isCanceled = false
          setTime(0)
          return
        }
        if (endTime - startTime > 0) setSolveHistory(a => [...a, endTime - startTime])
        return
      }
      else{
        endTime = Date.now() / 1000
        setTime(endTime - startTime)
      }
      setTimeout(a, 10)
    }
    a()
  }
  function getTime(){
    let a = String(time.toFixed(2))
    let l = a.split('.')
    return(
      <>
        {l[0]}.<label>{l[1]}</label>
      </>
    )
  }
  function showKeyBinding(keyName, desc){
    return <><div className={styles.key}>{keyName}</div><span className={styles.desc}>{desc}</span></>
  }
  function showTopPanel(){
    return(
      <div className={styles.topPanel} style={{
        transform: 'translateY(' + (isRunning ? '-100px' : '0px') + ')'
      }}>
        <span>{scramble}</span>
        <svg onClick={() => { setScramble(generateScramble()) }} xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M12 20q-3.35 0-5.675-2.325Q4 15.35 4 12q0-3.35 2.325-5.675Q8.65 4 12 4q1.725 0 3.3.713 1.575.712 2.7 2.037V4h2v7h-7V9h4.2q-.8-1.4-2.187-2.2Q13.625 6 12 6 9.5 6 7.75 7.75T6 12q0 2.5 1.75 4.25T12 18q1.925 0 3.475-1.1T17.65 14h2.1q-.7 2.65-2.85 4.325Q14.75 20 12 20Z" /></svg>
      </div>
    )
  }
  function showKeyBindings(){
    if(!isRunning){
      return(
        <>
          <div className={styles.manual}>
            {showKeyBinding('Spacebar (hold)', 'Start timer')}
            {showKeyBinding('N', 'New scramble')}
          </div>
        </>
      )
    }
    if(isRunning){
      return (
        <>
          <div className={styles.manual}>
            {showKeyBinding('Any', 'Stop timer')}
            {showKeyBinding('Backspace', 'Cancel solve')}
          </div>
        </>
      )
    }
  }
  function getAvg(){
    var sum = 0
    for(const i of solveHistory) sum += i
    return sum / solveHistory.length
  }
  return(
    <>
      {showTopPanel()}
      <div className={styles.time} style={{
        color: timerColor,
      }}>
        <span>{getTime()}</span>
      </div>
      {showKeyBindings()}
      <div className={styles.leftSidePanel} style={{
        transform: 'translate(' + (isRunning ? '-300px' : '0px') + ', -50%)',
      }}>
        <p>Solve count: {solveHistory.length}<br/>Avg: {getAvg().toFixed(2)}</p>
        <div className={styles.allTime}>
          <div className={styles.time2}><span>Time</span><span>Ao5</span><span>Ao12</span></div>
          {solveHistory.map((i, index) => {
            var ao5Solve = [], ao12Solve = []
            index++;
            if(index >= 5) ao5Solve = solveHistory.slice(index - 5, index)
            if (index >= 12) ao12Solve = solveHistory.slice(index - 12, index)
            var ao5 = 0
            var ao12 = 0
            if (ao5Solve.length) {
              let sum = 0
              let minVal = Infinity, maxVal = -1
              for (const i of ao5Solve) {
                sum += i
                minVal = Math.min(i, minVal)
                maxVal = Math.max(i, maxVal)
              }
              ao5 = (sum - minVal - maxVal) / 3
            }
            if (ao12Solve.length) {
              let sum = 0
              let minVal = Infinity, maxVal = -1
              for (const i of ao12Solve) {
                sum += i
                minVal = Math.min(i, minVal)
                maxVal = Math.max(i, maxVal)
              }
              ao12 = (sum - minVal - maxVal) / 10
            }
            return (
              <div className={styles.time1}><span>{i.toFixed(2)}</span><span>{ao5.toFixed(2)}</span><span>{ao12.toFixed(2)}</span></div>
            )
          })}
        </div>
      </div>
      <div className={styles.rightSidePanel} onClick={async () => {
        const name = prompt('Enter your name')
        const data = {
          metadata: {
            scramble: generateScramble()
          }
        }
        data[name] = {
          name: name,
          isHost: true,
          time: 0,
          isSolving: false
        }
        const docRef = await addDoc(collection(db, 'rooms'), data)
        setPlayerName(name)
        playerNameRef.current = name
        router.push(`/${docRef.id}`)
      }} style={{
        transform: 'translate(' + (isRunning ? '300px' : '0px') + ', -50%)',
      }}>
        <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M11 19v-6H5v-2h6V5h2v6h6v2h-6v6Z" /></svg>
        <span>Create rooms</span>
      </div>
    </>
  )
}