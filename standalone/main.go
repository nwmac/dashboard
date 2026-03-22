package main

import (
	"fmt"
	"log"
	"net/http"
	_ "net/http/pprof"
	"os"

	"github.com/rancher/dynamiclistener/server"
	"github.com/rancher/steve/pkg/debug"
	stevecli "github.com/rancher/steve/pkg/server/cli"
	"github.com/rancher/steve/pkg/version"
	"github.com/rancher/wrangler/v3/pkg/signals"
	"github.com/sirupsen/logrus"
	"github.com/urfave/cli/v2"
)

var (
	config      stevecli.Config
	debugconfig debug.Config
)

func main() {
	log.Println("Starting steve server...")
	log.Println("Version: 1.0.0")

	app := cli.NewApp()
	app.Name = "steve"
	app.Version = version.FriendlyVersion()
	app.Usage = ""
	app.Flags = append(
		stevecli.Flags(&config),
		debug.Flags(&debugconfig)...)
	app.Action = run

	if err := app.Run(os.Args); err != nil {
		logrus.Fatal(err)
	}
}

func run(_ *cli.Context) error {
	ctx := signals.SetupSignalContext()
	debugconfig.MustSetupDebug()
	s, err := config.ToServer(ctx, debugconfig.SQLCache)
	if err != nil {
		return err
	}
	if config.PprofEnabled {
		go func() {
			if err := http.ListenAndServe(config.PprofListenAddr, nil); err != nil {
				logrus.Fatalf("pprof server: %v\n", err)
			}
		}()
	}

	interceptor := NewInterceptor(s.Handler)
	interceptor.SetUIPath(config.UIPath)
	RegisterRoutes(interceptor)
	interceptor.StartReadinessCheck(fmt.Sprintf("https://127.0.0.1:%d", config.HTTPSListenPort))
	s.Handler = interceptor

	return s.ListenAndServe(ctx, config.HTTPSListenPort, config.HTTPListenPort, &server.ListenOpts{DisplayServerLogs: true})
}
