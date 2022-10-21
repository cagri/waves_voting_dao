import React, { Component } from 'react';
import { Signer } from '@waves/signer';
import { ProviderWeb } from '@waves.exchange/provider-web';
//import { libs } from '@waves/waves-transactions';
import { ProviderCloud } from '@waves.exchange/provider-cloud';
import { Navbar,Container,Button, Nav,Row,Modal,Col,ProgressBar,Alert,Form } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const node_address = "https://nodes-testnet.wavesnodes.com";
const TOKEN = "ENNO"
const DECIMAL = 8
const paymentAsset = "43W4FcqA1rEpSmUGHoGiXvpSLfhadws9LS5j3SJsKxxS"
const paymentAmount = 10000000000
const sc = "3N5YzdqDE6FDdsLNGXU4G4yrmirb2oiifEc"


class App extends Component {
  constructor() {
    super();
    this.state = {
      signType: '',
      signer: [],
      signedIn: false,
      address: '',
      balances: [],
      showModal: false,
      isPurposesLoaded: false,
      all : [],
      purposes: [],
      purposeId : 0,
      isLoaded: false,
      yesVotes: [],
      noVotes: [],
      owners: [],
      durations: [],
      showCreatePurposalModal: false,
      newPurposal : "",
      showVoteModal: false,
      voteId: 0,
      votePurposalId: 0,
      voteAmount: 0,
      actualHeight: 2290925,
      isBalancesLoaded: false,
    }
  }

  componentDidMount() {
    this.getHeight()
    this.getAll()
    this.getPurposes()

    console.log(this.state.balances)

    setInterval(() => {
      this.getHeight()
      this.getAll()
      this.getPurposes()
      }, 5000);
  }

  getHeight = async () => {
    await fetch(node_address + "/blocks/height")
    .then(res => res.json())
    .then(
      (result) => {
        this.setState({
          actualHeight: result.height
        });
      })
  } 

  login = async() => {
    const signer = new Signer({
      NODE_URL: node_address
    });
    signer.setProvider(new ProviderWeb());
    
    try {
      const userData = await signer.login();

      if (userData) {
        this.setState({signer: signer,signedIn: true, address:userData.address,showModal:false,signType:'seed'});
        toast.success("Login Successful!", {
          theme: "colored"
        });
      }
    } catch(err) {
      console.log(err)
      toast.error(err.message, {
        theme: "colored"
      });
    }
  }

  loginCloud = async() => {
    const signer = new Signer({
      NODE_URL: node_address
    });

    signer.setProvider(new ProviderCloud())

    try {
      const userData = await signer.login();
      if (userData) {
        this.setState({signer: signer,signedIn: true, address:userData.address,showModal:false,signType: 'email'})
        toast.success("Login Successful!", {
          theme: "colored"
        });
      }
    } catch(err) {
      toast.error("User rejection! try to login again!", {
        theme: "colored"
      });
    }

  }

  loginModalOpen = () => {
    this.setState({showModal: true})
  }

  handleCloseModal = () => {
    this.setState({showModal: false})
  }

  purposalModalOpen = () => {
    this.setState({showPurposalModal: true})
  }

  purposalHandleCloseModal = () => {
    this.setState({showPurposalModal: false})
  }

  voteModalOpen = (purposeId,vote) => {
    this.setState({showVoteModal: true,voteId: vote,votePurposalId: purposeId})
  }

  voteHandleCloseModal = () => {
    this.setState({showVoteModal: false})
  }

  truncate = (text, startChars, endChars, maxLength) => {
      if (text.length > maxLength) {
          var start = text.substring(0, startChars);
          var end = text.substring(text.length - endChars, text.length);
          while ((start.length + end.length) < maxLength)
          {
              start = start + '.';
          }
          return start + end;
      }
      return text;
  }

  logout = async() => {
    if (this.state.signedIn) {
      await this.state.signer.logout();
      this.setState({signer: '',signedIn: false, address: '', balances: []});
      toast.success("Logged out Successfully!")
    }
  }

  getAll = async () => {
    await fetch(node_address+'/addresses/data/'+sc+'?matches=purpose_%5BA-Za-z0-9%5D%2B_%5Ba-zA-Z%5D%2B')
    .then(response => response.json())
    .then(data => {
      this.setState({all: data, isLoaded: true})
    });
  }

  getPurposes = async () => {
    await fetch(node_address+'/addresses/data/'+sc+'?matches=%5Ba-zA-Z%5D%2B_%5Cd_text')
    .then(response => response.json())
    .then(data => {
      this.setState({purposes: data,isPurposesLoaded: true})
    });
  }


  base64Decode = (str) => {
    return decodeURIComponent((window.atob(str)));
  }

  vote = async (vote) => {
    const { signer, voteId, votePurposalId, voteAmount } = this.state;
    let amount = voteAmount * Math.pow(10,DECIMAL)
    const data = {
      dApp: sc,
      payment: [{
        assetId: paymentAsset,
        amount: amount,
      }],
      call: {
        function: 'vote4EnnoDAO',
        args: [
          {type: 'integer', value: votePurposalId},
          {type: 'integer', value: voteId},
        ],
      },
    }

  try {
    await signer
    .invoke(data)
    .broadcast().then(_data => {
      this.voteHandleCloseModal();
      toast.success("Vote submitted! ", {
        theme: "colored",
      });
    })
  } catch (err) {
    console.log(err)
    toast.error(err.message, {
      theme: "colored",
    });
  }

  }



  createPurposal = async () => {
    const purposalText = this.state.newPurposal

    const data = {
      dApp: sc,
      payment: [{
        assetId: paymentAsset,
        amount: paymentAmount,
      }],
      call: {
        function: 'newPurpose',
        args: [
          {type: 'string', value: purposalText},
        ],
      },
    }
    try {
      await this.state.signer
      .invoke(data)
      .broadcast().then(_data => {
        this.purposalHandleCloseModal();
        this.getAll();
        this.getPurposes();
        toast.success("Purposal submitted!", {
          theme: "colored"
        });
      }).complete(
        this.setState({newPurposal: ""})
      )
    } catch (err) {
      console.log(err)
      toast.error(err.message, {
        theme: "colored"
      });
    }
  }

  split = (arr) => {
    const myArray = arr.split("_");
    let word = myArray[0];

    return this.truncate(word,3,4,12)
  }

  findData = (data) => {
    const all = this.state.all;

    for (var i = 0; i < all.length; i++) {
      if (all[i].key === data) {
        return all[i].value
      }
    }
  }

  refresh = async () => {
    this.getAll();
    this.getPurposes();
  }


  percentageCalculation = (selected = 0,total=0) => {
    if (selected === 0 || total === 0) {
      return 0
    } else {
    let a = (selected/total)*100
    return a.toFixed(8)
    }
  }

  power = (amount = 0) => {
    return amount / Math.pow(10,DECIMAL)
  }

  claimButton = (endHeight,purposalId) => {
    const height = this.state.actualHeight
    if (height >= endHeight) {
      return (
        <Button style={{width: '100%'}} size="sm" onClick={() => this.claim(purposalId)} variant="light">Claim Locked Tokens</Button>
      )
    }
  }

  claim = async (purposalId) => {
    const data = {
      dApp: sc,
      call: {
        function: 'claimBack',
        args: [
          {type: 'integer', value: purposalId},
        ],
      },
    }  

    try {
      await this.state.signer
      .invoke(data)
      .broadcast().then(_data => {
        toast.success("Claimed!", {
          theme: "colored"
        });
      })
    } catch (err) {
      console.log(err)
      toast.error(err.message, {
        theme: "colored"
      });
    }    
  }

  render() {
    const connectButton = () => {
      if (!this.state.signedIn) {
        return (
          <Button onClick={() => this.loginModalOpen()} variant="dark">Connect Wallet</Button>
        )
      } else {
        return(
          <>
          <Button onClick={() => this.purposalModalOpen()} variant="success">Create a Purposal</Button>{' '}
          <Button onClick={() => this.logout()} variant="light"><i className="fa fa-power-off"></i> {this.truncate(this.state.address,3,4,12)}</Button>
          </>
        )
      }
    }


    return (
      <>
      <ToastContainer />
      <Navbar expand="lg">
      <Container>
        <Navbar.Brand href="#home">
          Governance
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">

          </Nav>
          {connectButton()}
        </Navbar.Collapse>
      </Container>
      </Navbar>
      <div className="App mb-5 pt-3" bg="dark" variant="dark">
        <Container>
          <Row>
            <Col lg={2}>
            </Col>
            <Col lg={8}>
              <div className="AppBody" id="home">
                <div>
                  <div className="AppTitle mt-5 mb-1">Governance</div>
                  <div className="AppSubTitle mb-4">
                    Vote for improvements & create a purposal
                  </div>
                </div>
              </div>
            </Col>
            <Col lg={2}>
            </Col>
          </Row>
        </Container>
      </div>

      <div className="purposes">
        <Container>
          <Row>
            <Col lg={3}>
              <div className="desc">
                <b>About Governance:</b><br/><br/>
                <p>
                  Create Purposal Fee: 100 Enno
                </p>
                <p>
                  Voting Lock Period: 1 Week
                </p>
              </div>
              <Button onClick={() => this.refresh()} variant="light">Refresh Data</Button>{' '} <br/><br/>
              Block Height: {this.state.actualHeight}
            </Col>
            <Col lg={6}>
              {(this.state.purposes).reverse().map((data,key) => (
                <div className="mb-5 pu" key={key}>
                  <div className="purposeNumber">Purposal ID: {data.key.split("_")[1]}</div>
                  <div className="purpose">
                  {this.base64Decode(data.value)}
                  </div>
                  <div className="purposeOwner">
                    Creator: {this.findData(data.key.split("_")[0]+"_"+data.key.split("_")[1]+"_owner")}
                  </div>
                  <div className="purposeOwner">
                    Duration: {this.findData(data.key.split("_")[0]+"_"+data.key.split("_")[1]+"_duration")}
                  </div>
                  <div className="purposeOwner">
                    Total Vote: {this.power(this.findData(data.key.split("_")[0]+"_"+data.key.split("_")[1]+"_totalVote"))} {TOKEN}
                  </div>
                  <ProgressBar className="mb-2">
                    <ProgressBar animated striped variant="success" now={this.percentageCalculation(this.findData(data.key.split("_")[0]+"_"+data.key.split("_")[1]+"_yes"),this.findData(data.key.split("_")[0]+"_"+data.key.split("_")[1]+"_totalVote"))} key={1} />
                    <ProgressBar animated striped variant="danger" now={this.percentageCalculation(this.findData(data.key.split("_")[0]+"_"+data.key.split("_")[1]+"_no"),this.findData(data.key.split("_")[0]+"_"+data.key.split("_")[1]+"_totalVote"))} key={3} />
                  </ProgressBar>
                  <Row>
                    <Col xs={6}>
                      <Button variant="dark" size="sm" className="w-100" onClick={() => this.voteModalOpen(data.key.split("_")[1],1)}>Yes</Button>
                      <div className="votePercentage">
                        {this.percentageCalculation(this.findData(data.key.split("_")[0]+"_"+data.key.split("_")[1]+"_yes"),this.findData(data.key.split("_")[0]+"_"+data.key.split("_")[1]+"_totalVote"))}%
                      </div>
                      <div className="votePercentage">
                        {this.power(this.findData(data.key.split("_")[0]+"_"+data.key.split("_")[1]+"_yes"))} {TOKEN}
                      </div>
                    </Col>
                    <Col xs={6}>
                      <Button variant="dark" size="sm" className="w-100" onClick={() => this.voteModalOpen(data.key.split("_")[1],2)}>No</Button>
                      <div className="votePercentage" style={{textAlign: 'right'}}>
                      {this.percentageCalculation(this.findData(data.key.split("_")[0]+"_"+data.key.split("_")[1]+"_no"),this.findData(data.key.split("_")[0]+"_"+data.key.split("_")[1]+"_totalVote"))}%
                      </div>
                      <div className="votePercentage" style={{textAlign: 'right'}}>
                        {this.power(this.findData(data.key.split("_")[0]+"_"+data.key.split("_")[1]+"_no"))} {TOKEN}
                      </div>
                    </Col>
                    <Col lg={12}>
                      <div className="d-grid gap-2">
                        {this.claimButton(this.findData(data.key.split("_")[0]+"_"+data.key.split("_")[1]+"_duration").split("_")[1],data.key.split("_")[1])}
                      </div>
                    </Col>
                  </Row>
                </div>
              ))}
            </Col>
            <Col lg={3}></Col>
          </Row>
        </Container>
      </div>


      <Modal
        show={this.state.showModal}
        aria-labelledby="contained-modal-title-vcenter"
        onHide={() => this.handleCloseModal()}
        >
        <Modal.Header>
          <Modal.Title id="contained-modal-title-vcenter">
           Governance
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <div className="d-grid gap-2">
            <Button style={{width: '100%', marginBottom:'10px'}} variant="dark" onClick={() => this.loginCloud()}><i className="fa fa-envelope"></i> Login with E-Mail</Button>
            <Button style={{width: '100%'}} variant="dark" onClick={() => this.login()}><i className="fa fa-key"></i> Login with Seed</Button>
          </div>
        </Modal.Body>
      </Modal>
      <Modal
        show={this.state.showPurposalModal}
        aria-labelledby="contained-modal-title-vcenter"
        onHide={() => this.purposalHandleCloseModal()}
        >
        <Modal.Header>
          <Modal.Title id="contained-modal-title-vcenter">
            Create a Purposal
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
            <Alert variant="info">
              <Alert.Heading>How to create a Purposal?</Alert.Heading>
              <p>
                1. Write your purposal in the text area below.<br/>
                2. Click on the "Create Purposal" button.<br/>
                3. Confirm the transaction.<br/>
                4. Wait for the transaction to be confirmed.<br/>
                5. Your purposal will be added to the list below.
              </p>
            </Alert>
            <Form>
              <Form.Group className="mb-3" controlId="exampleForm.ControlTextarea1">
                <Form.Label>Purposal</Form.Label>
                <Form.Control as="textarea" rows={3} onChange={(e) => this.setState({newPurposal: e.target.value})} />
                <Form.Text className="text-muted">
                  Purposal Fee: 100 {TOKEN}
                </Form.Text>
              </Form.Group>
            </Form>
            <div className="d-grid gap-2">
              <Button style={{width: '100%'}} variant="dark" onClick={() => this.createPurposal()}><i className="fa fa-plus"></i> Create Purposal</Button>
            </div>

        </Modal.Body>
      </Modal>
      <Modal
        show={this.state.showVoteModal}
        aria-labelledby="contained-modal-title-vcenter"
        onHide={() => this.voteHandleCloseModal()}
        >
        <Modal.Header>
          <Modal.Title id="contained-modal-title-vcenter">
            Vote for Purpose #{this.state.votePurposalId}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
            <Alert variant="info">
              <Alert.Heading>How to vote for a Purposal?</Alert.Heading>
              <p>
                1. Click on the "Yes" or "No" button.<br/>
                2. Enter Vote Amount & Confirm the transaction.<br/>
                3. Wait for the transaction to be confirmed.<br/>
                4. Your vote will be added to the list below.
              </p>
            </Alert>
            <Form>
              <Form.Group className="mb-3" controlId="exampleForm.ControlTextarea1">
                <Form.Label>Vote Amount</Form.Label>
                <Form.Control type="number" onChange={(e) => this.setState({voteAmount: e.target.value})} />
                <Form.Text className="text-muted">
                  Balance: 100 {TOKEN}
                </Form.Text>
                <Button style={{width: '100%', marginTop:'10px'}} variant="dark" onClick={() => this.vote()}><i className="fa fa-plus"></i> Vote</Button>
              </Form.Group>
            </Form>
        </Modal.Body>
      </Modal>
      </>
    );
  }
}

export default App;
