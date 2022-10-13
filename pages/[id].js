import styles from '../styles/Home.module.scss'
import generateScramble from 'scramble-generator';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from './api/db';

export default function Home({playerName, setPlayerName, playerNameRef}) {
    const router = useRouter()
    const [scramble, setScramble] = useState('')
    const [time, setTime] = useState(0)
    const [timerColor, setTimerColor] = useState('black')
    const [isRunning, setIsRunning] = useState(false)
    const [solveHistory, setSolveHistory] = useState([])
    const [isHost, setIsHost] = useState(false)
    const [players, setPlayers] = useState([])
    const isHostRef = useRef(false)
    const id = useRef()
    const dataRef = useRef()
    var isRunning1 = false
    var startTime = 0, endTime = 0
    var isStartDisabled = false
    var keyDownTime = 0, keyUpTime = 0;
    var isFired = false
    var isCanceled = false
    var isRedirected = playerNameRef.current.length != 0
    async function newScramble(){
        if(!isHostRef.current) return
        await updateDoc(doc(db, 'rooms', id.current), {
            metadata:{
                scramble: generateScramble()
            }
        })
    }
    useEffect(() => {
        window.addEventListener('beforeunload', (e) => {
            if(isHostRef.current) fetch(`/api/delDoc/${id.current}`, {
                method: 'get',
                headers: {
                    'Content-Type': 'application/json',
                },
                keepalive: true // this is important!
            }).then((res) => console.log('ok'))
            else fetch(`/api/delField/${id.current}/${playerNameRef.current}`, {
                method: 'get',
                headers: {
                    'Content-Type': 'application/json',
                },
                keepalive: true // this is important!
            }).then((res) => console.log('ok'))
            console.log('unload')
        })
        document.addEventListener('keydown', detectKeyDown, 'true')
        document.addEventListener('keyup', detectKeyUp, 'true')
    }, [])
    useEffect(() => {
        id.current = router.query.id
        if(typeof id.current == 'undefined') return
        onSnapshot(doc(db, 'rooms', id.current), async (doc1) => {
            console.log(doc1.data())
            if(typeof doc1.data() != 'undefined'){
                if (!isRedirected) {
                    isRedirected = true
                    var a = prompt('Enter your name')
                    if (a in doc1.data() || !a) {
                        alert('Invalid name')
                        router.push('/')
                    }
                    setPlayerName(a)
                    playerNameRef.current = a
                    setIsHost(false)
                    isHostRef.current = false
                    var tempdat = {}
                    tempdat[a] = {
                        name: a,
                        isHost: false,
                        time: 0,
                        isSolving: false
                    }
                    await updateDoc(doc(db, 'rooms', id.current), tempdat)
                }
                else{
                    setIsHost(doc1.data()[playerNameRef.current].isHost)
                    isHostRef.current = doc1.data()[playerNameRef.current].isHost
                    setPlayers(Object.values(doc1.data()))
                    dataRef.current = doc1.data()
                    setScramble(doc1.data().metadata.scramble)
                }
            }
        })
    }, [router.query])
    var setGreen
    function detectKeyDown(e) {
        if (isFired) return
        isFired = true
        if (isRunning1) {
            setIsRunning(false)
            isRunning1 = false
            isStartDisabled = true
            if (e.key == 'Backspace') {
                isCanceled = true
            }
            return
        }
        if (e.key == 'n') {
            newScramble()
        }
        if (e.key == ' ') {
            keyDownTime = Date.now()
            setTimerColor('red')
            setGreen = setTimeout(async () => {
                if (Date.now() - keyDownTime >= 500) {
                    setTimerColor('green')
                    setIsRunning(true)
                    isRunning1 = true
                    setTime(0)
                    clearInterval(setGreen)
                    const temp = {}
                    temp[playerNameRef.current + ".isSolving"] = true
                    await updateDoc(doc(db, 'rooms', id.current), temp)
                }
            }, 500);
        }
    }
    function detectKeyUp(e) {
        setTimerColor('black')
        clearInterval(setGreen)
        isFired = false
        keyUpTime = Date.now()
        if (isStartDisabled) {
            isStartDisabled = false
            return
        }
        if (keyUpTime - keyDownTime < 500) return
        if (e.key != ' ') return
        startTime = Date.now() / 1000
        const a = async () => {
            if (!isRunning1) {
                if (isCanceled) {
                    isCanceled = false
                    setTime(0)
                    return
                }
                if (endTime - startTime > 0) {
                    setSolveHistory(a => [...a, endTime - startTime])
                    const temp = {}
                    temp[playerNameRef.current + ".isSolving"] = false
                    temp[playerNameRef.current + ".time"] = endTime - startTime
                    await updateDoc(doc(db, 'rooms', id.current), temp)
                }
                return
            }
            else {
                endTime = Date.now() / 1000
                setTime(endTime - startTime)
            }
            setTimeout(a, 10)
        }
        a()
    }
    function getTime() {
        let a = String(time.toFixed(2))
        let l = a.split('.')
        return (
            <>
                {l[0]}.<label>{l[1]}</label>
            </>
        )
    }
    function showKeyBinding(keyName, desc) {
        return <><div className={styles.key}>{keyName}</div><span className={styles.desc}>{desc}</span></>
    }
    function showTopPanel() {
        function showSrambleIcon(){
            try{
                if (isHost) return <svg onClick={() => { newScramble() }} xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M12 20q-3.35 0-5.675-2.325Q4 15.35 4 12q0-3.35 2.325-5.675Q8.65 4 12 4q1.725 0 3.3.713 1.575.712 2.7 2.037V4h2v7h-7V9h4.2q-.8-1.4-2.187-2.2Q13.625 6 12 6 9.5 6 7.75 7.75T6 12q0 2.5 1.75 4.25T12 18q1.925 0 3.475-1.1T17.65 14h2.1q-.7 2.65-2.85 4.325Q14.75 20 12 20Z" /></svg>
            }
            catch {
                return null
            }
            return null
        }
        return (
            <div className={styles.topPanel} style={{
                transform: 'translateY(' + (isRunning ? '-100px' : '0px') + ')'
            }}>
                <span>{scramble}</span>
                {showSrambleIcon()}
            </div>
        )
    }
    function showKeyBindings() {
        if (!isRunning) {
            const a = () => {
                if (isHost) return showKeyBinding('N', 'New scramble')
                return null
            }
            return (
                <>
                    <div className={styles.manual}>
                        {showKeyBinding('Spacebar (hold)', 'Start timer')}
                        {a()}
                    </div>
                </>
            )
        }
        if (isRunning) {
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
    function getAvg() {
        var sum = 0
        for (const i of solveHistory) sum += i
        return sum / solveHistory.length
    }
    function showAllPlayer(){
    }
    return (
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
                <p>Solve count: {solveHistory.length}<br />Avg: {getAvg().toFixed(2)}</p>
                <div className={styles.allTime}>
                    <div className={styles.time2}><span>Time</span><span>Ao5</span><span>Ao12</span></div>
                    {solveHistory.map((i, index) => {
                        var ao5Solve = [], ao12Solve = []
                        index++;
                        if (index >= 5) ao5Solve = solveHistory.slice(index - 5, index)
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
                            <div className={styles.time1} key={index}><span>{i.toFixed(2)}</span><span>{ao5.toFixed(2)}</span><span>{ao12.toFixed(2)}</span></div>
                        )
                    })}
                </div>
            </div>
            <div className={styles.rightSidePanel1} style={{
                transform: 'translate(' + (isRunning ? '300px' : '0px') + ', -50%)',
            }}>
                {players.map((i, index) => {
                    console.log(i)
                    if(typeof i.scramble != 'undefined') return null
                    return (
                        <div key={index}>
                            <span className={styles.playerName}>{i.name}</span>
                            <span className={styles.playerTime}>{i.isSolving ? '...' : i.time.toFixed(2)}</span>
                        </div>
                    )
                })}
                <span className={styles.invite} onClick={() => {

                }}><svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M11 17H7q-2.075 0-3.537-1.463Q2 14.075 2 12t1.463-3.538Q4.925 7 7 7h4v2H7q-1.25 0-2.125.875T4 12q0 1.25.875 2.125T7 15h4Zm-3-4v-2h8v2Zm5 4v-2h4q1.25 0 2.125-.875T20 12q0-1.25-.875-2.125T17 9h-4V7h4q2.075 0 3.538 1.462Q22 9.925 22 12q0 2.075-1.462 3.537Q19.075 17 17 17Z" /></svg>Invite</span>
            </div>
        </>
    )
}