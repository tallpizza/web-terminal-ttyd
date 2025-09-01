package ssh

import (
	"fmt"
	"io"
	"os"

	"golang.org/x/crypto/ssh"
)

type SSHClient struct {
	client *ssh.Client
}

type rwc struct {
	io.Reader
	io.WriteCloser
}

func Dial(user, host string, port int, keyPath string) (*SSHClient, error) {
	key, err := os.ReadFile(keyPath)
	if err != nil {
		return nil, err
	}
	signer, err := ssh.ParsePrivateKey(key)
	if err != nil {
		return nil, err
	}
	cfg := &ssh.ClientConfig{
		User:            user,
		Auth:            []ssh.AuthMethod{ssh.PublicKeys(signer)},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}
	c, err := ssh.Dial("tcp", fmt.Sprintf("%s:%d", host, port), cfg)
	if err != nil {
		return nil, err
	}
	return &SSHClient{client: c}, nil
}

func (c *SSHClient) Shell(cols, rows int) (*ssh.Session, io.ReadWriteCloser, error) {
	sess, err := c.client.NewSession()
	if err != nil {
		return nil, nil, err
	}
	modes := ssh.TerminalModes{
		ssh.ECHO:          1,
		ssh.TTY_OP_ISPEED: 14400,
		ssh.TTY_OP_OSPEED: 14400,
	}
	if err := sess.RequestPty("xterm-256color", rows, cols, modes); err != nil {
		return nil, nil, err
	}
	stdin, err := sess.StdinPipe()
	if err != nil {
		return nil, nil, err
	}
	stdout, err := sess.StdoutPipe()
	if err != nil {
		return nil, nil, err
	}
	if err := sess.Start("zsh -l -c 'tmux new -As dev'"); err != nil {
		return nil, nil, err
	}
	return sess, &rwc{Reader: stdout, WriteCloser: stdin}, nil
}
