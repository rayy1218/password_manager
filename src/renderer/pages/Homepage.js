import {useState} from 'react'
import {useNavigate} from 'react-router-dom'

import Tabs from 'react-bootstrap/Tabs'
import Tab from 'react-bootstrap/Tab'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import Modal from 'react-bootstrap/Modal'

import '../stylesheet/Homepage.css'

function Homepage(props) {
    return (
        <div className='center'>
            <div className='login-register-tabs'>
                <Tabs defaultActiveKey='login'>
                    <Tab eventKey='login' title='Login'>
                        <LoginForm setUser={props.setUser} className='form' />
                    </Tab>
                    <Tab eventKey='register' title='Register'>
                        <RegisterForm setUser={props.setUser} className='form' />
                    </Tab>
                </Tabs>
            </div>
        </div>
    )
}

function LoginForm(props) {
    const navigate = useNavigate()

    const [input, setInput] = useState({username: '', password: ''})
    const [alert_show, setAlertShow] = useState({
        username_failure: false,
        password_failure: false
    })

    const handleChange = (event) => {
        const id = event.target.id
        const value = event.target.value
        setInput(values => ({...values, [id]: value}))
    }

    const handleSubmit = async() => {
        let login_check_reply = await window.dbcall.loginCheck({
            username: input.username, 
            password: input.password
        })

        switch (login_check_reply) {
            case 'success':
                let statement = `SELECT * FROM users WHERE user_name = '${input.username}'`,
                    user_id = (await window.dbcall.get({statement: statement})).user_id
                props.setUser({username: input.username, user_id: user_id})
                setAlertShow({username_failure: false, password_failure: false})
                navigate('vault')
                break

            case 'username_failure':
                setAlertShow({username_failure: true, password_failure: false})
                break

            case 'password_failure':
                setAlertShow({username_failure: false, password_failure: true})
                break
        }
    }

    return (
        <Form>
            <Alert show={alert_show.username_failure} variant='danger'>
                The username isn't registered yet. Consider typing error or register the user.
            </Alert>
            <Alert show={alert_show.password_failure} variant='danger'>
                The password isn't match. Consider typing error.
            </Alert>
            <Form.Group controlId='username'>
                <Form.Label>Username: </Form.Label>
                <Form.Control type='text' onChange={handleChange} placeholder='Username' />
            </Form.Group>
            <Form.Group controlId='password'>
                <Form.Label>Password: </Form.Label>
                <Form.Control type='password' onChange={handleChange} placeholder='Password' />
            </Form.Group>
            <br />
            <Button onClick={handleSubmit}>Login</Button>
        </Form>
    )
}

function RegisterForm(props) {
    const navigate = useNavigate()

    const [input, setInput] = useState({username: '', password: ''})
    const [alert_show, setAlertShow] = useState({username_failure: false})
    
    const [modal_show, setModalShow] = useState(false)
    const showModal = () => {setModalShow(true)}
    const hideModal = () => {setModalShow(false)}

    const handleChange = (event) => {
        const id = event.target.id
        const value = event.target.value
        setInput(values => ({...values, [id]: value}))       
    }

    const handleSubmit = async() => {
        const register_user_reply = await window.dbcall.registerUser({user: input})
        switch (register_user_reply) {
            case 'success':
                setAlertShow({username_failure: false})
                showModal()
                break

            case 'username_failure':
                setAlertShow({username_failure: true})
                break
        }
    }
    
    const handleConfirm = () => {
        navigate('/')
        hideModal()
    }

    return (
        <>
        <Form>
            <Alert show={alert_show.username_failure} variant='danger'>
                This username has been register. Consider trying with another username.
            </Alert>
            <Form.Group controlId='username'>
                <Form.Label>Username: </Form.Label>
                <Form.Control type='text' onChange={handleChange} placeholder='Username' />
            </Form.Group>
            <Form.Group controlId='password'>
                <Form.Label>Password: </Form.Label>
                <Form.Control type='password' onChange={handleChange} placeholder='Password' />
            </Form.Group>
            <br />
            <Button onClick={handleSubmit}>Register</Button>
        </Form>
        <Modal show={modal_show} onHide={hideModal}>
            <Modal.Header>
                <Modal.Title>Success</Modal.Title>
            </Modal.Header>
            <Modal.Body>You are able to login now.</Modal.Body>
            <Modal.Footer>
                <Button onClick={handleConfirm}>Confirm</Button>
            </Modal.Footer>
        </Modal>
        </>
    )
}

export default Homepage
