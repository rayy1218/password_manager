import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'
import Form from 'react-bootstrap/Form'
import InputGroup from 'react-bootstrap/InputGroup'

import {useState, useEffect} from 'react'
import {useNavigate} from 'react-router-dom'
import Fuse from 'fuse.js'

import '../stylesheet/Vault.css'

function Vault(props) {
    return (
        <div className='vault-body'>
            <Header username={props.user.username} logout={props.logout}/>
            <Content user={props.user}/>
        </div>
    )
}

function Header(props) {
    const navigate = useNavigate()
    const handleLogout = () => {
        props.logout()
        navigate('/')
    }

    return (
        <div className='header'>
            <h1 className='header-left'>{props.username}'s Vault</h1>
            <div className='header-right'>
                <Button onClick={handleLogout}>Logout</Button>
            </div>
        </div>
    )
}

function Content(props) {
    const [list, setList] = useState([]);
    const [search, setSearch] = useState('')

    const updateList = async() => {
        const statement = 
            `SELECT * FROM passwords 
             WHERE user_id = ${props.user.user_id}`
        const result = await window.dbcall.getAll({statement: statement})
        setList(result)
    }

    const deleteItem = (password_id) => {
        const statement = 
            `DELETE FROM passwords 
             WHERE password_id = ${password_id}`
        window.dbcall.query({statement: statement})

        updateList()
    }
    
    const handleCopy = (password_string) => {
        window.clipboard.write(password_string)
    }
    
    useEffect(() => { 
        updateList()
    }, [props.user])

    useEffect(() => {
        if (search.length === 0) {updateList()}

        const options = {
            includeScore: true,
            findAllMatches: true,
            keys: ['password_title', 'password_url']
        }

        const fuse = new Fuse(list, options)
        
        const result = fuse.search(search)
        const new_list = []
        for (let i = 0; i < result.length; i += 1) {
            new_list.push(result[i].item)
        }

        setList(new_list)
    }, [search])

    return (
        <div className='content'>
            <VaultControl 
                setSearch={setSearch} user={props.user} updateList={updateList} 
            />
            <div className='flex-container'>
            {list.map((item, index) => (
                <Item item={item} updateList={updateList} />
            ))}
            </div>
        </div>
    )
    
}

function VaultControl(props) {
    return (
        <div className='control'>
            <SearchBar setSearch={props.setSearch} />
            <AddItemModal user={props.user} updateList={props.updateList} />
        </div>
    )
}

function SearchBar(props) {
    const [input, setInput] = useState('')
    
    const handleChange = (event) => {
        setInput(event.target.value)
    }
    
    const handleSubmit = () => {
        props.setSearch(input)
    }

    return (
        <Form className='search-bar'>
            <Form.Group controlId='search_string'>
                <InputGroup>
                    <Form.Control 
                        type='text' placeholder='Search' onChange={handleChange} 
                    />
                    <Button onClick={handleSubmit}>></Button>
                </InputGroup>
            </Form.Group>
        </Form>
    )
}

function AddItemModal(props) {
    const [showing, setShowing] = useState(false)
    const [input, setInput] = useState({
        name: '', 
        website: '', 
        username_or_email: '', 
        password: ''
    })

    const doShow = () => {if (props.user.user_id != null) setShowing(true)}
    const doHide = () => {setShowing(false)}
   
    const doSubmit = async() => {
        const statement = 
            `INSERT INTO passwords (
                password_string, password_title, password_url, 
                user_name_or_email, user_id
            ) 
            VALUES (
                '${input.password}', '${input.name}', '${input.website}', 
                '${input.username_or_email}', ${props.user.user_id}
            )`
        await window.dbcall.query({statement: statement})
        
        props.updateList()
        doHide()
    }

    return (
        <>
            <Button className='add-item-btn' onClick={doShow}>Add</Button>    

            <Modal show={showing} onHide={doHide}>
                <Modal.Header closeButton>
                    <Modal.Title>Add Item</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <ItemForm setInput={setInput} input={input} />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant='primary' onClick={doSubmit}>Add Item</Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

function Item(props) {
    const deleteItem = (password_id) => {
        const statement = 
            `DELETE FROM passwords 
             WHERE password_id = ${password_id}`
        window.dbcall.query({statement: statement})

        props.updateList()
    }
    
    const handleCopy = (password_string) => {
        window.clipboard.write(password_string)
    }

    return (
        <div className='flex-item'>
            <InputGroup>
                <Form.Control 
                    readOnly size='lg' type='text' value={props.item.password_title}
                />
                <Button onClick={() => deleteItem(props.item.password_id)}>
                    Delete
                </Button>
                <EditItemModal 
                    password_id={props.item.password_id} updateList={props.updateList}
                />
            </InputGroup>
            <br />
            <InputGroup>
                <InputGroup.Text>Website</InputGroup.Text>
                <Form.Control 
                    readOnly size='sm' type='text' 
                    value={props.item.password_website || 'null'} 
                />
            </InputGroup>
            <InputGroup>
                <InputGroup.Text>Username/Email</InputGroup.Text>
                <Form.Control 
                    readOnly size='sm' type='text' 
                    value={props.item.user_name_or_email || 'null'} 
                />
            </InputGroup>
             <InputGroup>
                <InputGroup.Text>Password</InputGroup.Text>
                <Form.Control 
                    readOnly size='sm' type='text' 
                    value={props.item.password_string} 
                />
                <Button onClick={() => handleCopy(props.item.password_string)}>
                    Copy
                </Button>
            </InputGroup>
        </div>
    )
}

function EditItemModal(props) {
    const [showing, setShowing] = useState(false)
    const doShow = () => {setShowing(true)}
    const doHide = () => {setShowing(false)}

    const [input, setInput] = useState({
        name: '', 
        website: '', 
        username_or_email: '', 
        password: '' 
    })
    
    useEffect(() => {
        const setEditFormInput = async() => {
            const statement = 
                `SELECT * FROM passwords 
                 WHERE password_id = ${props.password_id}`

            const item = await window.dbcall.get({statement: statement})
            const new_input = {
                name: item.password_title,
                website: item.password_url,
                username_or_email: item.user_name_or_email,
                password: item.password_string
            }

            setInput(new_input)
        }

        setEditFormInput()
    }, [showing, props.password_id])

    const doSubmit = async() => {
        const statement = 
            `UPDATE passwords 
             SET password_string = '${input.password}', 
             password_title = '${input.name}', 
             password_url = '${input.website}', 
             user_name_or_email = '${input.username_or_email}' 
             WHERE password_id = ${props.password_id}`
        await window.dbcall.query({statement: statement})

        props.updateList()
        doHide()
    }
    
    return (
        <>
            <Button onClick={doShow}>Edit</Button>    

            <Modal show={showing} onHide={doHide}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Item</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <ItemForm setInput={setInput} input={input}/>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant='primary' onClick={doSubmit}>Submit</Button>
                </Modal.Footer>
            </Modal>
        </>
    )

}

function ItemForm(props) {
    const handleChange = (event) => {
        const id = event.target.id
        const value = event.target.value
        props.setInput(values => ({...values, [id]: value}))
    }

    return (
        <Form>
            <Form.Group controlId='name'>
                <Form.Label>Name:</Form.Label>
                <Form.Control 
                    type='text' placeholder='Enter Name' 
                    value={props.input.name} onChange={handleChange}
                />
            </Form.Group>
            <Form.Group controlId='website'>
                <Form.Label>Website URL:</Form.Label>
                <Form.Control 
                    type='url' placeholder='Enter Website URL' 
                    value={props.input.website} onChange={handleChange} 
                />
            </Form.Group>
            <Form.Group controlId='username_or_email'>
                <Form.Label>Username/Email:</Form.Label>
                <Form.Control 
                    type='text' placeholder='Enter Username/Email' 
                    value={props.input.username_or_email} onChange={handleChange} 
                />
            </Form.Group>
            <Form.Group controlId='password'>
                <Form.Label>Password:</Form.Label>
                <Form.Control 
                    type='text' placeholder='Enter Password' 
                    value={props.input.password} onChange={handleChange} 
                />
            </Form.Group>
            <hr />
            <GenerateRandPassword setInput={props.setInput} />
        </Form>
    )
}

function GenerateRandPassword(props) {
    const [input, setInput] = useState({
        length: 8,
        lower: true, 
        upper: false, 
        number: false, 
        symbol: false
    })

    const generatePassword = () => {
        const lower = 'abcdefghijklmnopqrstuvwxyz'
        const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        const number = '1234567890'
        const symbol = '@#$%&?'

        let rand_pool = ''
        if (input.lower) {rand_pool += lower}
        if (input.upper) {rand_pool += upper}
        if (input.number) {rand_pool += number}
        if (input.symbol) {rand_pool += symbol}
        

        if (rand_pool.length === 0 || input.length === 0) {return ''}

        let result = ''
        for (let i = 0; i < input.length; i += 1) {
            result += rand_pool[Math.floor(Math.random() * rand_pool.length)]
        }
        return result
    }

    const handleChange = (event) => {
        const id = event.target.id
        const value = event.target.value
        setInput(values => ({...values, [id]: value}))

    }

    const handleToggle = (event) => {
        const id = event.target.id
        setInput(values => ({...values, [id]: !(input[id])}))
    }

    const handleSubmit = () => {
        const result = generatePassword()
        props.setInput(values => ({...values, password: result}))
    }

    return (
        <> 
            <h5>Generate Password Rules</h5>
            <Form.Group>
            <Form.Label>Length</Form.Label>
            <Form.Control 
                id='length' type='number' placeholder='Password Length' 
                onChange={handleChange} value={input.length}
            />
            <Form.Check 
                id='lower' onChange={handleToggle} type='checkbox' 
                label='Lower' checked={input.lower}
            />
            <Form.Check 
                id='upper' onChange={handleToggle} type='checkbox' 
                label='Upper' checked={input.upper}
            />
            <Form.Check 
                id='number' onChange={handleToggle} type='checkbox' 
                label='Number' checked={input.number}
            />
            <Form.Check 
                id='symbol' onChange={handleToggle} type='checkbox' 
                label='Symbol' checked={input.symbol}
            />    
            </Form.Group>
            <Button onClick={handleSubmit}>Generate</Button>
        </>
    )
}

export default Vault
