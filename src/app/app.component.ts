import { Component, Renderer2 } from '@angular/core';
import html2canvas from 'html2canvas';
import jspdf from 'jspdf';
import { DomSanitizer } from '@angular/platform-browser';
import {saveAs as importedSaveAs} from "file-saver";

class ItemDetails {
  dataId: number;
  zIndex: number;
  path: Path2D; // Add the 'path' property
  coordinates: number[]; // Add the 'coordinates' property
  colorcode: string;
  state: boolean;
  constructor(dataId: number, zIndex: number, path: Path2D, coordinates: any[], colorcode: string, state: boolean) {
    this.dataId = dataId;
    this.zIndex = zIndex;
    this.path = path;
    this.coordinates = coordinates;
    this.colorcode = colorcode;
    this.state = state;
  }
}

const itemDetails: ItemDetails[] = [];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'coach-config';

  constructor(private renderer2: Renderer2, private domSanitizer: DomSanitizer) { }

  headerJson = "";
  detailJson: string[] = [];

  ngAfterViewInit(): void {
    console.log("ngAfterViewInit");
    this.loadDiagramDetails();
    window.addEventListener("load", this.draw);
    this.renderer2.listen("document", "click", event => this.printMousePos(event));
  }

  loadDiagramDetails() {
    console.log("loadDiagramDetails");
    const canvas = document.getElementById("coachcanvas");
    const ctx = (canvas as HTMLCanvasElement)?.getContext("2d");

    let j = itemDetails.length;
    for (let k = 0; k < this.detailJson.length; k++) {
      const detailResult = JSON.parse(this.detailJson[k]);
      for (let i = 0; i < detailResult.length; i++) {
        if (detailResult[i].RegionType == "R") {
          if (ctx) {
            ctx.fillStyle = detailResult[i].ColorCode;
          }
          const rectDim: number[] = detailResult[i].Regions.split(',').map(Number) as number[];
          const rectPath = new Path2D();
          rectPath.rect(rectDim[0], rectDim[1], rectDim[2], rectDim[3]);
          itemDetails[j] = new ItemDetails(detailResult[i].DataId, detailResult[i].Zindex, rectPath, rectDim, detailResult[i].ColorCode, false);
          j++;
        }
      }
    }

    console.log(itemDetails);
  }

  draw() {
    console.log("draw");

    const canvas = document.getElementById("coachcanvas");
    if (canvas) {
      (canvas as HTMLCanvasElement).width = window.innerWidth;
      (canvas as HTMLCanvasElement).height = window.innerHeight;
    }

    if ((canvas as HTMLCanvasElement).getContext) {
      const headerResult = JSON.parse(this.headerJson);
      const ctx = (canvas as HTMLCanvasElement)?.getContext("2d");
      let yOffset = 0;
      for (let i = 0; i < headerResult.length; i++) {
        const lineDimStr = headerResult[i].Lines.split('|');
        for (let j = 0; j < lineDimStr.length; j++) {
          const lineDim = lineDimStr[j].split(',').map(Number) as number[];
          ctx?.beginPath();
          console.log(lineDim[1] + yOffset);
          ctx?.moveTo(lineDim[0], lineDim[1] + yOffset);
          ctx?.lineTo(lineDim[2], lineDim[3] + yOffset);
          ctx?.stroke();
        }

        const rectangleDimStr = headerResult[i].Rectangles.split('|');
        for (let j = 0; j < rectangleDimStr.length; j++) {
          const rectDim = rectangleDimStr[j].split(',').map(Number) as number[];
          ctx?.strokeRect(rectDim[0], rectDim[1] + yOffset, rectDim[2], rectDim[3]);
        }

        const ellipseDimStr = headerResult[i].Eclipses.split('|');
        for (let j = 0; j < ellipseDimStr.length; j++) {
          const ellipseDim = ellipseDimStr[j].split(',').map(Number) as number[];
          ctx?.beginPath();
          ctx?.ellipse(ellipseDim[0], ellipseDim[1] + yOffset, ellipseDim[2], ellipseDim[3], Math.PI / 4, 0, 2 * Math.PI);
          ctx?.stroke();
        }

        yOffset += 300;
      }

      for (let i = 0; i < itemDetails.length; i++) {
        if (itemDetails[i].zIndex == 1 && itemDetails[i].state === true) {
          if (ctx) {
            ctx.fillStyle = itemDetails[i].colorcode;
            ctx.fillRect(itemDetails[i].coordinates[0], itemDetails[i].coordinates[1],
              itemDetails[i].coordinates[2], itemDetails[i].coordinates[3]);
          }
        }

        if (itemDetails[i].zIndex == 0 && itemDetails[i].state === true) {
          if (ctx) {
            ctx.fillStyle = itemDetails[i].colorcode;
            ctx?.fillRect(itemDetails[i].coordinates[0], itemDetails[i].coordinates[1] + 300,
              itemDetails[i].coordinates[2], itemDetails[i].coordinates[3]);
          }
        }

        if (itemDetails[i].zIndex == -1 && itemDetails[i].state === true) {
          if (ctx) {
            ctx.fillStyle = itemDetails[i].colorcode;
            ctx?.fillRect(itemDetails[i].coordinates[0], itemDetails[i].coordinates[1] + 600,
              itemDetails[i].coordinates[2], itemDetails[i].coordinates[3]);
          }
        }
      }
    }
  }

  printMousePos(event: MouseEvent) {
    const canvas = document.getElementById("coachcanvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    const canvasBoundingLeft = canvas.getBoundingClientRect().left;
    const canvasBoundingTop = canvas.getBoundingClientRect().top;
    console.log("canvasBoundingLeft: " + canvasBoundingLeft + " - canvasBoundingTop: " + canvasBoundingTop);
    console.log("clientX: " + event.clientX + " - clientY: " + event.clientY);
    for (let i = 0; i < itemDetails.length; i++) {
      if (itemDetails[i].zIndex == 1
        && ctx?.isPointInPath(itemDetails[i].path, event.clientX - canvasBoundingLeft, event.clientY - canvasBoundingTop)
        && !ctx.isPointInStroke(itemDetails[i].path, event.clientX - canvasBoundingLeft, event.clientY - canvasBoundingTop)) {
        console.log("inside path " + itemDetails[i].coordinates);
        if (itemDetails[i].state !== true) {
          ctx.fillStyle = itemDetails[i].colorcode;
          ctx?.fillRect(itemDetails[i].coordinates[0], itemDetails[i].coordinates[1],
            itemDetails[i].coordinates[2], itemDetails[i].coordinates[3]);
          itemDetails[i].state = true;
          break;
        } else {
          ctx?.clearRect(itemDetails[i].coordinates[0], itemDetails[i].coordinates[1],
            itemDetails[i].coordinates[2], itemDetails[i].coordinates[3]);
          itemDetails[i].state = false;
          this.draw();
        }
      }

      if (itemDetails[i].zIndex == 0
        && ctx?.isPointInPath(itemDetails[i].path, event.clientX - canvasBoundingLeft, event.clientY - canvasBoundingTop - 300)
        && !ctx?.isPointInStroke(itemDetails[i].path, event.clientX - canvasBoundingLeft, event.clientY - canvasBoundingTop - 300)) {
        console.log("inside path " + itemDetails[i].coordinates);
        if (itemDetails[i].state !== true) {
          ctx.fillStyle = itemDetails[i].colorcode;
          ctx?.fillRect(itemDetails[i].coordinates[0], itemDetails[i].coordinates[1] + 300,
            itemDetails[i].coordinates[2], itemDetails[i].coordinates[3]);
          itemDetails[i].state = true;
          break;
        } else {
          ctx?.clearRect(itemDetails[i].coordinates[0], itemDetails[i].coordinates[1] + 300,
            itemDetails[i].coordinates[2], itemDetails[i].coordinates[3]);
          itemDetails[i].state = false;
          this.draw();
        }
      }

      if (itemDetails[i].zIndex == -1
        && ctx?.isPointInPath(itemDetails[i].path, event.clientX - canvasBoundingLeft, event.clientY - canvasBoundingTop - 600)
        && !ctx?.isPointInStroke(itemDetails[i].path, event.clientX - canvasBoundingLeft, event.clientY - canvasBoundingTop - 600)) {
        console.log("inside path " + itemDetails[i].coordinates);
        if (itemDetails[i].state !== true) {
          ctx.fillStyle = itemDetails[i].colorcode;
          ctx?.fillRect(itemDetails[i].coordinates[0], itemDetails[i].coordinates[1] + 600,
            itemDetails[i].coordinates[2], itemDetails[i].coordinates[3]);
          itemDetails[i].state = true;
          break;
        } else {
          ctx?.clearRect(itemDetails[i].coordinates[0], itemDetails[i].coordinates[1] + 600,
            itemDetails[i].coordinates[2], itemDetails[i].coordinates[3]);
          itemDetails[i].state = false;
          this.draw();
        }
      }
    }
  }

  mouseMove(event: MouseEvent) {
    const canvas = document.getElementById("coachcanvas") as HTMLCanvasElement;
    const ctx = canvas?.getContext("2d");
    console.log("clientX: " + event.clientX + " - clientY: " + event.clientY);

    for (let i = 0; i < itemDetails.length; i++) {
      if (ctx?.isPointInPath(itemDetails[i].path, event.clientX, event.clientY)) {
        if (itemDetails[i].state != true) {
          ctx.fillStyle = "rgba(228, 4, 41, 0.2)";
          ctx.fillRect(itemDetails[i].coordinates[0] + 1, itemDetails[i].coordinates[1] + 1,
            itemDetails[i].coordinates[2] - 5, itemDetails[i].coordinates[3] - 5);
        }
        break;
      }
      else {
        if (ctx && itemDetails[i].state != true) {
          ctx.clearRect(itemDetails[i].coordinates[0] + 1, itemDetails[i].coordinates[1] + 1,
            itemDetails[i].coordinates[2] - 5, itemDetails[i].coordinates[3] - 5);
          ctx.fillStyle = itemDetails[i].colorcode;
          // ctx.strokeRect(itemDetails[i].coordinates[0], itemDetails[i].coordinates[1], 
          //   itemDetails[i].coordinates[2], itemDetails[i].coordinates[3]);
        }
      }

      if (ctx) {
        if (ctx.isPointInPath(itemDetails[i].path, event.clientX, Number(event.clientY) - Number(300))) {
          if ((itemDetails[i] as ItemDetails).state != true) {
            ctx.fillStyle = "rgba(228, 4, 41, 0.2)";
            ctx.fillRect(itemDetails[i].coordinates[0] + 1, itemDetails[i].coordinates[1] + 300 + 1,
              itemDetails[i].coordinates[2] - 5, itemDetails[i].coordinates[3] - 5);
          }
          break;
        } else {
          ctx.clearRect(itemDetails[i].coordinates[0] + 1, itemDetails[i].coordinates[1] + 300 + 1,
            itemDetails[i].coordinates[2] - 5, itemDetails[i].coordinates[3] - 5);
          ctx.fillStyle = (itemDetails[i] as ItemDetails).colorcode;
          // ctx.strokeRect(itemDetails[i].coordinates[0], Number(itemDetails[i].coordinates[1]) + Number(300),
          //   itemDetails[i].coordinates[2], itemDetails[i].coordinates[3]);
        }
      }

      if (ctx) {
        if (ctx.isPointInPath((itemDetails[i] as ItemDetails).path, event.clientX, Number(event.clientY) - Number(600))) {
          if ((itemDetails[i] as ItemDetails).state != true) {
            ctx.fillStyle = "rgba(228, 4, 41, 0.2)";
            ctx.fillRect(itemDetails[i].coordinates[0] + 1, itemDetails[i].coordinates[1] + 600 + 1,
              itemDetails[i].coordinates[2] - 5, itemDetails[i].coordinates[3] - 5);
          }
          break;
        } else {
          ctx.clearRect(itemDetails[i].coordinates[0] + 1, itemDetails[i].coordinates[1] + 600 + 1,
            itemDetails[i].coordinates[2] - 5, itemDetails[i].coordinates[3] - 5);
          ctx.fillStyle = itemDetails[i].colorcode;
          // ctx.strokeRect(itemDetails[i].coordinates[0], Number(itemDetails[i].coordinates[1]) + Number(600),
          //   itemDetails[i].coordinates[2], itemDetails[i].coordinates[3]);
        }
      }
    }

    //document.getElementById("coachcanvas").addEventListener("mousemove", mouseMove);
  }

  public onChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement?.files && inputElement.files.length > 0) {
      console.log(inputElement.files);
      let detailJsonIndex = 0;
      for (const file of Array.from(inputElement.files)) {
        if (file.name.includes("header")) {
          const fileReader: FileReader = new FileReader();
          fileReader.onloadend = (x) => {
            console.log("header file found - " + file.name);
            this.headerJson = fileReader.result as string;
            this.draw();
          }
          fileReader.readAsText(file);
        } else if (file.name.includes("Detail")) {
          const fileReader: FileReader = new FileReader();
          fileReader.onloadend = (x) => {
            console.log("detail file found - " + file.name);
            this.detailJson[detailJsonIndex++] = fileReader.result as string;
            this.loadDiagramDetails();
          }
          fileReader.readAsText(file);
        }
      }
    }
  }

  public saveCanvasPDF() {
    const data = document.getElementById('coachcanvas');
    if (data) {
      html2canvas(data).then(canvas => {
        const imgWidth = 208;
        const imgHeight = canvas.height * imgWidth / canvas.width;

        const contentDataURL = canvas.toDataURL('image/png')
        const pdf = new jspdf('p', 'mm', 'a4'); // A4 size page of PDF
        const position = 0;
        pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight)
        pdf.save('coach-config.pdf'); // Generated PDF
      });
      this.saveSelectedItemsJson();
    }
  }

  private saveSelectedItemsJson() {
    console.log("savePoints");
    console.log(itemDetails);
    const jsonData = JSON.stringify(itemDetails.filter(x => x.state === true));
    const blob = new Blob([jsonData], {
      type: 'application/json'
    });
    importedSaveAs(blob, "coach-config.json");
  }
}